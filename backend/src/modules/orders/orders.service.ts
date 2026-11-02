import { waitUntil } from "@vercel/functions";
import { Types, type FilterQuery } from "mongoose";
import {
  CACHE_TAGS,
  ORDER_TRANSITIONS,
  STATUSES_BY_GROUP,
  orderStatusGroup,
  type CheckoutInput,
  type OrderDto,
  type OrderGroupCounts,
  type OrderStatus,
  type OrderStatusGroup,
  type PaymentMethod,
  type orderDeliverySchema,
} from "@nosa/contracts";
import type { z } from "zod";
import { ApiError } from "@/shared/http/api-error";
import { buildMeta, toSkip } from "@/shared/http/pagination";
import { nextSequence } from "@/shared/services/counter.service";
import { revalidateFrontend } from "@/shared/services/next-revalidate.service";
import { clearCart, getCartDocument, resolveCartLines, type CartOwner } from "@/modules/cart/cart.service";
import { attachRedemptionToOrder, evaluateCoupon, redeemCoupon, releaseCoupon } from "@/modules/coupons/coupons.service";
import { getPaymentProvider } from "@/modules/payments/payment-providers";
import { recordSales, reserveStock, restoreStock } from "@/modules/products/products.pricing";
import { getSettings } from "@/modules/settings/settings.service";
import { getUserPhone } from "@/modules/users/users.service";
import { OrderModel, type OrderDocument } from "./orders.model";

type OrderDelivery = z.infer<typeof orderDeliverySchema>;

const round = (value: number) => Math.round(value * 100) / 100;

function toDto(doc: OrderDocument): OrderDto {
  const json = doc.toJSON() as unknown as OrderDto & { internalNotes?: unknown; idempotencyKey?: string; user?: unknown };
  const { internalNotes: _n, idempotencyKey: _k, user: _u, ...dto } = json;
  return dto;
}

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const seq = await nextSequence(`order-${year}`);
  return `NOSA-${year}-${String(seq).padStart(6, "0")}`;
}

/**
 * Turns the cart into an order. Steps that change shared state (stock, coupon uses) are undone
 * if a later step fails, and the idempotency key makes retries/double clicks return the same order.
 */
export async function checkout(owner: CartOwner, input: CheckoutInput, idempotencyKey?: string) {
  if (idempotencyKey) {
    const existing = await OrderModel.findOne({ idempotencyKey });
    if (existing) return toDto(existing);
  }

  const settings = await getSettings();
  if (!owner.userId && !settings.checkout.allowGuest) throw ApiError.unauthorized("Please sign in to place an order");
  const payment = getPaymentProvider(input.paymentMethod ?? "cod", settings.checkout.enabledPaymentMethods);

  const cart = await getCartDocument(owner);
  const lines = cart ? await resolveCartLines(cart) : [];
  if (!cart || !lines.length) throw new ApiError("VALIDATION_ERROR", "Your cart is empty", { cart: ["CART_EMPTY"] });

  const unavailable = lines.filter((line) => !line.available);
  if (unavailable.length) {
    throw new ApiError(
      "CONFLICT",
      "Some items are no longer available",
      Object.fromEntries(unavailable.map((line) => [`items.${line.id}`, [`MAX_${line.maxQuantity}`]])),
    );
  }

  const subtotal = round(lines.reduce((sum, line) => sum + line.lineTotal, 0));
  const coupon = cart.couponCode ? await evaluateCoupon(cart.couponCode, { subtotal, phone: input.contact.phone }) : null;
  const discount = coupon?.discount ?? 0;

  const stock = await reserveStock(lines);
  let redemption: Awaited<ReturnType<typeof redeemCoupon>> | null = null;
  try {
    if (coupon) redemption = await redeemCoupon(coupon.id, input.contact.phone);

    const order = await OrderModel.create({
      number: await nextOrderNumber(),
      user: owner.userId,
      idempotencyKey,
      status: "pending",
      statusHistory: [{ status: "pending" }],
      contact: input.contact,
      address: input.address,
      source: input.source,
      items: lines.map(({ id: _id, available: _a, maxQuantity: _m, productId, ...line }) => ({ ...line, product: productId })),
      subtotal,
      discount,
      // Delivery and its cost are agreed with the customer on WhatsApp, so nothing is added here.
      shippingFee: 0,
      total: round(Math.max(subtotal - discount, 0)),
      couponCode: coupon?.code,
      paymentMethod: input.paymentMethod ?? "cod",
      notes: input.notes,
    });

    const started = await payment.start({ id: order.id, number: order.number, total: order.total });
    order.paymentStatus = started.status;
    await order.save();

    if (redemption) await attachRedemptionToOrder(redemption.id, order.id);
    await clearCart(cart.id);
    waitUntil(
      Promise.all([
        recordSales(lines),
        revalidateFrontend([CACHE_TAGS.products, ...lines.map((line) => CACHE_TAGS.product(line.slug))]),
      ]),
    );
    return toDto(order);
  } catch (error) {
    await restoreStock(stock);
    if (coupon && redemption) await releaseCoupon(coupon.id, redemption.id);
    // A parallel request with the same key won the race: return its order.
    if (idempotencyKey && typeof error === "object" && error && "code" in error && error.code === 11000) {
      const existing = await OrderModel.findOne({ idempotencyKey });
      if (existing) return toDto(existing);
    }
    throw error;
  }
}

// ── Customer ───────────────────────────────────────────────────────────────

type CustomerScope = { user?: string; phone?: string };

/** One customer's orders: placed while signed in, or as a guest with the account's phone. */
async function customerScope({ user, phone }: CustomerScope): Promise<FilterQuery<OrderDocument>> {
  const accountPhone = user && !phone ? await getUserPhone(user) : null;
  const phones = [phone, accountPhone].filter((value): value is string => !!value);
  // ObjectId, not the string: aggregate $match does not cast like find() does.
  const or = [...(user ? [{ user: new Types.ObjectId(user) }] : []), ...phones.map((value) => ({ "contact.phone": value }))];
  return or.length ? { $or: or } : {};
}

export async function listMyOrders(userId: string) {
  const docs = await OrderModel.find(await customerScope({ user: userId })).sort({ createdAt: -1 }).limit(100);
  return docs.map(toDto);
}

export async function getMyOrder(userId: string, number: string) {
  const doc = await OrderModel.findOne({ ...(await customerScope({ user: userId })), number });
  if (!doc) throw ApiError.notFound("Order");
  return toDto(doc);
}

/** Public tracking for guests: needs both the order number and the phone used at checkout. */
export async function trackOrder(number: string, phone: string) {
  const doc = await OrderModel.findOne({ number: number.toUpperCase(), "contact.phone": phone });
  if (!doc) throw ApiError.notFound("Order");
  return toDto(doc);
}

// ── Dashboard ──────────────────────────────────────────────────────────────

type DashboardQuery = CustomerScope & {
  page: number;
  limit: number;
  status?: OrderStatus;
  group?: OrderStatusGroup;
  paymentMethod?: PaymentMethod;
  governorate?: string;
  q?: string;
  from?: Date;
  to?: Date;
};

export async function listOrders({ status, group, user, phone, paymentMethod, governorate, q, from, to, ...page }: DashboardQuery) {
  const filter: FilterQuery<OrderDocument> = {
    ...(await customerScope({ user, phone })),
    ...(status ? { status } : group && { status: { $in: STATUSES_BY_GROUP[group] } }),
    ...(paymentMethod && { paymentMethod }),
    ...(governorate && { "address.governorate": governorate }),
    ...((from || to) && { createdAt: { ...(from && { $gte: from }), ...(to && { $lte: to }) } }),
  };
  if (q) {
    const term = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const search = [{ number: new RegExp(term, "i") }, { "contact.phone": new RegExp(term) }, { "contact.name": new RegExp(term, "i") }];
    // The customer scope may already use $or, so the search joins it with $and.
    filter.$and = [{ $or: search }];
  }

  const [docs, total] = await Promise.all([
    OrderModel.find(filter)
      .select("number status contact source shipment total paymentMethod paymentStatus createdAt items.quantity")
      .sort({ createdAt: -1 })
      .skip(toSkip(page))
      .limit(page.limit),
    OrderModel.countDocuments(filter),
  ]);

  const items = docs.map((doc) => ({
    id: doc.id,
    number: doc.number,
    status: doc.status,
    customer: { name: doc.contact?.name ?? "", phone: doc.contact?.phone ?? "" },
    source: doc.source,
    shipment: doc.shipment?.scope ? doc.toJSON().shipment : undefined,
    itemCount: doc.items.reduce((sum, item) => sum + item.quantity, 0),
    total: doc.total,
    paymentMethod: doc.paymentMethod,
    paymentStatus: doc.paymentStatus,
    createdAt: (doc as unknown as { createdAt: Date }).createdAt,
  }));
  return { items, meta: buildMeta(page, total) };
}

export async function getOrder(id: string) {
  const doc = await OrderModel.findById(id).populate("internalNotes.by", "name");
  if (!doc) throw ApiError.notFound("Order");
  return { ...toDto(doc), internalNotes: doc.toJSON().internalNotes, allowedNextStatuses: ORDER_TRANSITIONS[doc.status] };
}

/** Counts per group plus money spent on confirmed orders, for the tabs and a customer's page. */
export async function countOrderGroups(scope: CustomerScope): Promise<OrderGroupCounts> {
  const rows = await OrderModel.aggregate<{ _id: OrderStatus; count: number; total: number }>([
    { $match: await customerScope(scope) },
    { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: "$total" } } },
  ]);
  const counts: OrderGroupCounts = { all: 0, pending: 0, confirmed: 0, cancelled: 0, spent: 0 };
  for (const row of rows) {
    const group = orderStatusGroup(row._id);
    counts[group] += row.count;
    counts.all += row.count;
    if (group === "confirmed") counts.spent = round(counts.spent + row.total);
  }
  return counts;
}

/** Orders per group for a page of customers, in one aggregation (keyed by phone). */
export async function countOrdersByPhones(phones: string[]) {
  const rows = await OrderModel.aggregate<{ _id: { phone: string; status: OrderStatus }; count: number }>([
    { $match: { "contact.phone": { $in: phones } } },
    { $group: { _id: { phone: "$contact.phone", status: "$status" }, count: { $sum: 1 } } },
  ]);
  const result: Record<string, Record<OrderStatusGroup, number>> = {};
  for (const row of rows) {
    const counts = (result[row._id.phone] ??= { pending: 0, confirmed: 0, cancelled: 0 });
    counts[orderStatusGroup(row._id.status)] += row.count;
  }
  return result;
}

function applyDelivery(doc: OrderDocument, delivery: OrderDelivery) {
  const { scope, country, governorate, city, street, carrier, trackingNumber } = delivery;
  doc.set("address", scope === "domestic" ? { governorate, city, street } : { country, city, street });
  doc.set("shipment", { scope, carrier: carrier || undefined, trackingNumber: trackingNumber || undefined });
}

/** Edits where a confirmed order goes and its shipping company / tracking number. */
export async function updateOrderDelivery(id: string, delivery: OrderDelivery) {
  const doc = await OrderModel.findById(id);
  if (!doc) throw ApiError.notFound("Order");
  applyDelivery(doc, delivery);
  await doc.save();
  return getOrder(id);
}

/** Moves an order along the allowed path. Confirming needs the delivery details; cancelling or returning puts the stock back. */
export async function updateOrderStatus(id: string, next: OrderStatus, actorId: string, note?: string, delivery?: OrderDelivery) {
  const doc = await OrderModel.findById(id);
  if (!doc) throw ApiError.notFound("Order");
  if (!ORDER_TRANSITIONS[doc.status].includes(next)) {
    throw new ApiError("CONFLICT", `Can't move an order from ${doc.status} to ${next}`, { "body.status": ["INVALID_TRANSITION"] });
  }
  if (next === "confirmed") {
    if (!delivery) throw new ApiError("VALIDATION_ERROR", "Delivery details are required to confirm", { "body.delivery": ["REQUIRED"] });
    applyDelivery(doc, delivery);
  }

  doc.status = next;
  doc.statusHistory.push({ status: next, by: actorId, note });
  if (next === "delivered" && doc.paymentMethod === "cod") doc.paymentStatus = "paid";
  if (next === "returned" && doc.paymentStatus === "paid") doc.paymentStatus = "refunded";
  await doc.save();

  if (next === "cancelled" || next === "returned") {
    await restoreStock(
      doc.items.map((item) => ({
        productId: String(item.product),
        sku: item.sku ?? undefined,
        quantity: item.quantity,
        isMadeToOrder: item.isMadeToOrder,
      })),
    );
    waitUntil(revalidateFrontend([CACHE_TAGS.products, ...doc.items.map((item) => CACHE_TAGS.product(item.slug))]));
  }
  return getOrder(id);
}

export async function addInternalNote(id: string, text: string, actorId: string) {
  const doc = await OrderModel.findByIdAndUpdate(id, { $push: { internalNotes: { text, by: actorId } } }, { new: true });
  if (!doc) throw ApiError.notFound("Order");
  return getOrder(id);
}

/** True when the user has a delivered order containing the product (verified purchase). */
export async function hasDeliveredProduct(userId: string, productId: string) {
  return Boolean(await OrderModel.exists({ user: userId, status: "delivered", "items.product": productId }));
}

const COUNTED_STATUSES = ["pending", "confirmed", "in_production", "ready", "shipped", "delivered"] as const;

/** Sales numbers for the dashboard; cancelled and returned orders don't count as revenue. */
export async function getSalesStats(from: Date) {
  const match = { createdAt: { $gte: from }, status: { $in: COUNTED_STATUSES } };
  const [totals, byDay, byStatus, topProducts] = await Promise.all([
    OrderModel.aggregate<{ revenue: number; orders: number }>([
      { $match: match },
      { $group: { _id: null, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
    ]),
    OrderModel.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Africa/Cairo" } }, revenue: { $sum: "$total" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    OrderModel.aggregate<{ _id: OrderStatus; count: number }>([
      { $match: { createdAt: { $gte: from } } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    OrderModel.aggregate<{ _id: string; slug: string; name: { ar: string; en: string }; quantity: number; revenue: number }>([
      { $match: match },
      { $unwind: "$items" },
      { $group: { _id: "$items.product", slug: { $first: "$items.slug" }, name: { $first: "$items.name" }, quantity: { $sum: "$items.quantity" }, revenue: { $sum: "$items.lineTotal" } } },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const revenue = round(totals[0]?.revenue ?? 0);
  const orders = totals[0]?.orders ?? 0;
  return {
    revenue,
    orders,
    averageOrderValue: orders ? round(revenue / orders) : 0,
    revenueByDay: byDay.map((d) => ({ date: d._id, revenue: round(d.revenue), orders: d.orders })),
    ordersByStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    topProducts: topProducts.map(({ _id, ...p }) => ({ productId: String(_id), ...p, revenue: round(p.revenue) })),
  };
}

export async function listRecentOrders(limit = 5) {
  return (await listOrders({ page: 1, limit })).items;
}
