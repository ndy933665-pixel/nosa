import { Router } from "express";
import { z } from "zod";
import { orderDashboardQuerySchema, orderDeliverySchema, orderNoteSchema, updateOrderStatusSchema } from "@nosa/contracts";
import { idParamsSchema } from "@/shared/http/params";
import { validate } from "@/shared/middlewares/validate";
import * as controller from "./orders.controller";

const summaryQuerySchema = orderDashboardQuerySchema.pick({ user: true, phone: true });
const customerCountsQuerySchema = z.object({
  phones: z
    .string()
    .max(2000)
    .transform((value) => value.split(",").filter(Boolean).slice(0, 100)),
});

/** All dashboard roles handle orders (staff included). */
export const ordersDashboardRoutes = Router();

ordersDashboardRoutes.get("/", validate({ query: orderDashboardQuerySchema }), controller.list);
ordersDashboardRoutes.get("/summary", validate({ query: summaryQuerySchema }), controller.summary);
ordersDashboardRoutes.get("/customer-counts", validate({ query: customerCountsQuerySchema }), controller.customerCounts);
ordersDashboardRoutes.get("/:id", validate({ params: idParamsSchema }), controller.detail);
ordersDashboardRoutes.patch("/:id/status", validate({ params: idParamsSchema, body: updateOrderStatusSchema }), controller.updateStatus);
ordersDashboardRoutes.patch("/:id/delivery", validate({ params: idParamsSchema, body: orderDeliverySchema }), controller.updateDelivery);
ordersDashboardRoutes.post("/:id/notes", validate({ params: idParamsSchema, body: orderNoteSchema }), controller.addNote);
