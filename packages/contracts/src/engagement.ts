import { z } from "zod";
import type { LocalizedText } from "./i18n";
import { imageSchema, type ImageAsset } from "./media";
import { phoneSchema } from "./phone";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);

// ── Reviews ────────────────────────────────────────────────────────────────

export const REVIEW_STATUSES = ["pending", "approved", "rejected"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().min(3).max(1000),
  images: z.array(imageSchema).max(3).default([]),
});

export const reviewModerationSchema = z.object({ status: z.enum(REVIEW_STATUSES) });

export type ReviewDto = {
  id: string;
  rating: number;
  body: string;
  images: ImageAsset[];
  author: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
};

// ── Wishlist ───────────────────────────────────────────────────────────────

export const wishlistToggleSchema = z.object({ productId: objectId });

// ── Custom orders ──────────────────────────────────────────────────────────

export const CUSTOM_ORDER_TYPES = ["dress_set", "cardigan", "bag", "embroidery", "accessory", "other"] as const;
export const CUSTOM_ORDER_STATUSES = ["new", "quoted", "accepted", "in_production", "delivered", "rejected", "cancelled"] as const;
export type CustomOrderStatus = (typeof CUSTOM_ORDER_STATUSES)[number];

export const customOrderInputSchema = z.object({
  contact: z.object({ name: z.string().trim().min(2).max(80), phone: phoneSchema }),
  type: z.enum(CUSTOM_ORDER_TYPES),
  description: z.string().trim().min(10).max(2000),
  sizes: z.string().trim().max(200).optional(),
  colors: z.string().trim().max(200).optional(),
  budget: z.number().positive().max(100_000).optional(),
  neededBy: z.coerce.date().optional(),
  referenceImages: z.array(imageSchema).max(5).default([]),
});

export type CustomOrderInput = z.input<typeof customOrderInputSchema>;
export type CustomOrderType = (typeof CUSTOM_ORDER_TYPES)[number];

export type CustomOrderDto = {
  id: string;
  number: string;
  contact: { name: string; phone: string };
  type: CustomOrderType;
  description: string;
  sizes?: string;
  colors?: string;
  budget?: number;
  neededBy?: string;
  referenceImages: ImageAsset[];
  status: CustomOrderStatus;
  quote?: { price: number; productionDays: number; message?: string; at: string };
  history: { status: CustomOrderStatus; at: string; note?: string }[];
  createdAt: string;
  /** Only on the dashboard detail response. */
  allowedNextStatuses?: CustomOrderStatus[];
};

export const customOrderQuoteSchema = z.object({
  price: z.number().positive(),
  productionDays: z.number().int().min(1).max(90),
  message: z.string().trim().max(1000).optional(),
});

export const customOrderStatusSchema = z.object({
  status: z.enum(CUSTOM_ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

/** Allowed status moves; "quoted → accepted" is done by the customer. */
export const CUSTOM_ORDER_TRANSITIONS: Record<CustomOrderStatus, readonly CustomOrderStatus[]> = {
  new: ["quoted", "rejected"],
  quoted: ["accepted", "rejected", "cancelled"],
  accepted: ["in_production", "cancelled"],
  in_production: ["delivered", "cancelled"],
  delivered: [],
  rejected: [],
  cancelled: [],
};

// ── Content (home page sections & pages) ───────────────────────────────────

const lt = z.object({ ar: z.string().trim().min(1), en: z.string().trim().min(1) });
const href = z.string().trim().regex(/^\/[^\s]*$|^https:\/\/[^\s]+$/, "INVALID_LINK");

export const homeSectionContentSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("hero"),
    title: lt,
    subtitle: lt.optional(),
    image: imageSchema.optional(),
    primaryCta: z.object({ label: lt, href }),
    secondaryCta: z.object({ label: lt, href }).optional(),
  }),
  z.object({ type: z.literal("categories"), title: lt, categorySlugs: z.array(z.string()).max(8).default([]) }),
  z.object({
    type: z.literal("products"),
    title: lt,
    source: z.enum(["featured", "newest", "bestsellers", "category"]),
    categorySlug: z.string().optional(),
    limit: z.number().int().min(4).max(12).default(8),
  }),
  z.object({
    type: z.literal("banner"),
    title: lt,
    text: lt.optional(),
    image: imageSchema.optional(),
    cta: z.object({ label: lt, href }).optional(),
    /** Numbered steps ("how a custom order works"); when present the banner shows them beside the text. */
    steps: z.array(lt).max(4).optional(),
  }),
  z.object({ type: z.literal("stories"), title: lt }),
  z.object({ type: z.literal("reviews"), title: lt }),
  z.object({
    type: z.literal("richText"),
    title: lt.optional(),
    body: lt,
    image: imageSchema.optional(),
    /** Small figures under the text ("100% handmade"); when present the block becomes a two-column panel. */
    stats: z.array(z.object({ value: z.string().trim().min(1).max(12), label: lt })).max(4).optional(),
    cta: z.object({ label: lt, href }).optional(),
  }),
]);

export type HomeSectionContent = z.infer<typeof homeSectionContentSchema>;
export type HomeSectionType = HomeSectionContent["type"];

/** The kinds of section the owner can add, in the order the add menu lists them. */
export const HOME_SECTION_TYPES = ["hero", "categories", "products", "banner", "richText", "stories", "reviews"] as const satisfies readonly HomeSectionType[];

export const homeSectionInputSchema = z.object({
  content: homeSectionContentSchema,
  isActive: z.boolean().default(true),
});

export type HomeSectionDto = { id: string; order: number; isActive: boolean; content: HomeSectionContent };

export const pageInputSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: lt,
  /** Rich-text HTML from the dashboard editor; sanitised by the backend. */
  body: lt,
  isPublished: z.boolean().default(true),
  seo: z.object({ title: lt.partial().optional(), description: lt.partial().optional() }).optional(),
});

export type PageDto = {
  id: string;
  slug: string;
  title: LocalizedText;
  body: LocalizedText;
  isPublished: boolean;
  updatedAt: string;
};
