import { z } from "zod";
import { ORDER_STATUSES, PAYMENT_METHODS, type OrderStatus, type PaymentMethod, type PaymentStatus } from "./enums";
import type { LocalizedText } from "./i18n";
import type { ImageAsset } from "./media";
import { phoneSchema } from "./phone";

const money = z.number().nonnegative().multipleOf(0.01);

// ── Shipping ───────────────────────────────────────────────────────────────

export const shippingRateInputSchema = z.object({
  fee: money,
  estimatedDays: z.object({ min: z.number().int().min(0), max: z.number().int().min(0) }),
  isActive: z.boolean(),
});

export type GovernorateDto = {
  code: string;
  name: LocalizedText;
  fee: number;
  estimatedDays: { min: number; max: number };
  isActive: boolean;
};

// ── Coupons ────────────────────────────────────────────────────────────────

export const COUPON_TYPES = ["percent", "fixed", "free_shipping"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const couponInputSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,30}$/, "INVALID_CODE"),
    type: z.enum(COUPON_TYPES),
    value: money.default(0),
    minSubtotal: money.default(0),
    maxUses: z.number().int().positive().nullable().default(null),
    perUserLimit: z.number().int().positive().nullable().default(null),
    startsAt: z.coerce.date().nullable().default(null),
    endsAt: z.coerce.date().nullable().default(null),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== "percent" || (c.value > 0 && c.value <= 100), { path: ["value"], message: "INVALID_PERCENT" })
  .refine((c) => c.type !== "fixed" || c.value > 0, { path: ["value"], message: "INVALID_VALUE" })
  .refine((c) => !c.startsAt || !c.endsAt || c.startsAt < c.endsAt, { path: ["endsAt"], message: "ENDS_BEFORE_START" });

export type CouponInput = z.infer<typeof couponInputSchema>;

// ── Cart ───────────────────────────────────────────────────────────────────

export const MAX_LINE_QUANTITY = 10;
export const CART_ID_HEADER = "x-cart-id";

export const addCartItemSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
  /** Required when the product has variants. */
  sku: z.string().trim().min(1).optional(),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY).default(1),
  /** Values for the product's customization fields, keyed by field key. */
  customization: z.record(z.string(), z.string().trim().max(500)).default({}),
});

export type AddCartItemInput = z.input<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({ quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY) });
export const applyCouponSchema = z.object({ code: z.string().trim().min(1).max(30) });

export type CartLineDto = {
  id: string;
  productId: string;
  slug: string;
  name: LocalizedText;
  image?: ImageAsset;
  sku?: string;
  optionValues: Record<string, string>;
  optionLabels: LocalizedText[];
  customization: Record<string, string>;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** False when the product was unpublished or the stock no longer covers the quantity. */
  available: boolean;
  maxQuantity: number;
  isMadeToOrder: boolean;
};

export type CartDto = {
  id: string;
  items: CartLineDto[];
  itemCount: number;
  subtotal: number;
  discount: number;
  coupon: { code: string; type: CouponType; freeShipping: boolean } | null;
  /** Coupon present but no longer valid (expired, below minimum...). */
  couponError: string | null;
};

// ── Checkout & orders ──────────────────────────────────────────────────────

export const IDEMPOTENCY_HEADER = "idempotency-key";

/** "How did you hear about us?" — optional on the checkout form. */
export const ORDER_SOURCES = ["instagram", "facebook", "tiktok", "friend", "google", "other"] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const checkoutSchema = z.object({
  contact: z.object({
    name: z.string().trim().min(2).max(80),
    phone: phoneSchema,
    email: z.email().optional(),
  }),
  /** Delivery is agreed on WhatsApp, so no address is collected at checkout; old orders may still have one. */
  address: z
    .object({
      governorate: z.string().trim().min(1),
      city: z.string().trim().min(2).max(80),
      street: z.string().trim().min(3).max(200),
      building: z.string().trim().max(100).optional(),
      landmark: z.string().trim().max(200).optional(),
    })
    .optional(),
  /** Payment is settled when the order is handed over (agreed on WhatsApp), so it is always cash for now. */
  paymentMethod: z.enum(PAYMENT_METHODS).default("cod"),
  source: z.enum(ORDER_SOURCES).optional(),
  notes: z.string().trim().max(500).optional(),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

/** Which status may follow which. Cancelling/returning restores stock. */
export const ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_production", "ready", "cancelled"],
  in_production: ["ready", "cancelled"],
  ready: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
};

/** Customers and the dashboard filter orders by these three groups instead of every status. */
export const ORDER_STATUS_GROUPS = ["pending", "confirmed", "cancelled"] as const;
export type OrderStatusGroup = (typeof ORDER_STATUS_GROUPS)[number];

export const STATUSES_BY_GROUP: Record<OrderStatusGroup, readonly OrderStatus[]> = {
  pending: ["pending"],
  confirmed: ["confirmed", "in_production", "ready", "shipped", "delivered"],
  cancelled: ["cancelled", "returned"],
};

export const orderStatusGroup = (status: OrderStatus): OrderStatusGroup =>
  ORDER_STATUS_GROUPS.find((group) => STATUSES_BY_GROUP[group].includes(status)) ?? "pending";

export const DELIVERY_SCOPES = ["domestic", "international"] as const;
export type DeliveryScope = (typeof DELIVERY_SCOPES)[number];

const optionalText = (max: number) => z.string().trim().max(max).optional();

/**
 * Filled in the dashboard when an order is confirmed: where it goes (required) and,
 * when known, the shipping company and tracking number (optional, shown only if filled).
 */
export const orderDeliverySchema = z
  .object({
    scope: z.enum(DELIVERY_SCOPES),
    country: optionalText(60),
    governorate: optionalText(60),
    city: z.string().trim().min(2).max(80),
    street: z.string().trim().min(5).max(300),
    carrier: optionalText(80),
    trackingNumber: optionalText(80),
  })
  .superRefine((delivery, ctx) => {
    if (delivery.scope === "domestic" && !delivery.governorate) ctx.addIssue({ code: "custom", path: ["governorate"], message: "REQUIRED" });
    if (delivery.scope === "international" && !delivery.country) ctx.addIssue({ code: "custom", path: ["country"], message: "REQUIRED" });
  });

export type OrderDeliveryInput = z.input<typeof orderDeliverySchema>;

/** Confirming an order needs its delivery details; Express enforces the same rule. */
export const updateOrderStatusSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    note: z.string().trim().max(500).optional(),
    delivery: orderDeliverySchema.optional(),
  })
  .refine((body) => body.status !== "confirmed" || body.delivery, { path: ["delivery"], message: "REQUIRED" });

export const orderNoteSchema = z.object({ note: z.string().trim().min(1).max(1000) });

export const trackOrderSchema = z.object({ number: z.string().trim().min(5).max(30), phone: phoneSchema });

export const orderDashboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(ORDER_STATUSES).optional(),
  group: z.enum(ORDER_STATUS_GROUPS).optional(),
  /** One customer's orders: placed with their account or with their phone as a guest. */
  user: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  phone: z.string().trim().max(20).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  governorate: z.string().optional(),
  q: z.string().trim().max(50).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type OrderItemDto = {
  product: string;
  slug: string;
  name: LocalizedText;
  image?: ImageAsset;
  sku?: string;
  optionValues: Record<string, string>;
  optionLabels: LocalizedText[];
  customization: Record<string, string>;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isMadeToOrder: boolean;
};

export type OrderDto = {
  id: string;
  number: string;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; at: string; note?: string }[];
  contact: CheckoutInput["contact"];
  /** Set by the dashboard on confirmation; older orders have the checkout address (governorate code + name). */
  address?: {
    country?: string;
    governorate?: string;
    governorateName?: LocalizedText;
    city?: string;
    street?: string;
    building?: string;
    landmark?: string;
  };
  shipment?: { scope: DeliveryScope; carrier?: string; trackingNumber?: string };
  source?: OrderSource;
  items: OrderItemDto[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  notes?: string;
  estimatedDays?: { min: number; max: number };
  createdAt: string;
};

export type DashboardOrderListItem = {
  id: string;
  number: string;
  status: OrderStatus;
  customer: { name: string; phone: string };
  source?: OrderSource;
  shipment?: OrderDto["shipment"];
  itemCount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
};

/** Order counts per group (and money spent on confirmed orders), for tabs and customer pages. */
export type OrderGroupCounts = Record<OrderStatusGroup | "all", number> & { spent: number };

export type DashboardOrderDto = OrderDto & {
  /** `by` is populated with the staff member's name. */
  internalNotes: { text: string; by?: { name?: string } | null; at: string }[];
  allowedNextStatuses: OrderStatus[];
};

export type CouponDto = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  perUserLimit: number | null;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
  usedCount: number;
  createdAt: string;
};
