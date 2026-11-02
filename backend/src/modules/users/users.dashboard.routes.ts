import { Router } from "express";
import { DASHBOARD_ROLES } from "@nosa/contracts";
import { idParamsSchema } from "@/shared/http/params";
import { requireRole } from "@/shared/middlewares/auth";
import { validate } from "@/shared/middlewares/validate";
import * as controller from "./users.controller";
import { createStaffSchema, customersQuerySchema, updateStaffSchema } from "./users.validation";

/** Mounted under /dashboard/users (requireAuth is applied by the dashboard router). */
export const usersDashboardRoutes = Router();

const managers = requireRole("admin", "owner");

usersDashboardRoutes.get("/customers", requireRole(...DASHBOARD_ROLES), validate({ query: customersQuerySchema }), controller.listCustomers);
usersDashboardRoutes.get("/customers/:id", requireRole(...DASHBOARD_ROLES), validate({ params: idParamsSchema }), controller.getCustomer);
usersDashboardRoutes.get("/staff", managers, controller.listStaff);
usersDashboardRoutes.post("/staff", managers, validate({ body: createStaffSchema }), controller.createStaff);
usersDashboardRoutes.patch("/staff/:id", managers, validate({ params: idParamsSchema, body: updateStaffSchema }), controller.updateStaff);
usersDashboardRoutes.post("/:id/reset-link", managers, validate({ params: idParamsSchema }), controller.resetLink);
