import { Schema, model, Types } from "mongoose";
import { DELIVERY_SCOPES, ORDER_SOURCES, ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } from "@nosa/contracts";
import { imageSchema, requiredLocalizedTextSchema } from "@/shared/db/schemas";

/** Items are a snapshot: later product edits never change what the customer bought. */
const orderItemSchema = new Schema(
  {
    product: { type: Types.ObjectId, ref: "Product", required: true },
    slug: { type: String, required: true },
    name: { type: requiredLocalizedTextSchema, required: true },
    image: imageSchema,
    sku: String,
    optionValues: { type: Map, of: String, default: {} },
    optionLabels: { type: [requiredLocalizedTextSchema], default: [] },
    customization: { type: Map, of: String, default: {} },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, required: true },
    isMadeToOrder: { type: Boolean, default: false },
  },
  { _id: false },
);

const statusEntrySchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Types.ObjectId, ref: "User" },
    note: String,
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    number: { type: String, required: true, unique: true },
    user: { type: Types.ObjectId, ref: "User", index: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    statusHistory: { type: [statusEntrySchema], default: [] },
    contact: {
      name: { type: String, required: true },
      phone: { type: String, required: true, index: true },
      email: String,
    },
    address: {
      country: String,
      governorate: String,
      governorateName: requiredLocalizedTextSchema,
      city: String,
      street: String,
      building: String,
      landmark: String,
    },
    shipment: {
      scope: { type: String, enum: DELIVERY_SCOPES },
      carrier: String,
      trackingNumber: String,
    },
    items: { type: [orderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, required: true },
    total: { type: Number, required: true },
    source: { type: String, enum: ORDER_SOURCES },
    couponCode: String,
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true, index: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "unpaid" },
    estimatedDays: { min: Number, max: Number },
    notes: String,
    internalNotes: { type: [{ text: String, by: { type: Types.ObjectId, ref: "User" }, at: { type: Date, default: Date.now } }], default: [] },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

export const OrderModel = model("Order", orderSchema);
export type OrderDocument = InstanceType<typeof OrderModel>;
