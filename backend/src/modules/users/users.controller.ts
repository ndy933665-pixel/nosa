import type { RequestHandler } from "express";
import { sendSuccess } from "@/shared/http/api-response";
import { currentUser } from "@/shared/middlewares/auth";
import * as authService from "@/modules/auth/auth.service";
import { createResetLink } from "@/modules/auth/auth.service";
import * as usersService from "./users.service";
import type { CustomersQuery } from "./users.validation";

export const listCustomers: RequestHandler = async (_req, res) => {
  const { items, meta } = await usersService.listCustomers(res.locals.query as CustomersQuery);
  sendSuccess(res, items, 200, meta);
};

export const getCustomer: RequestHandler = async (req, res) => {
  sendSuccess(res, await usersService.getCustomer(String(req.params.id)));
};

export const listStaff: RequestHandler = async (_req, res) => {
  sendSuccess(res, await usersService.listStaff());
};

export const createStaff: RequestHandler = async (req, res) => {
  sendSuccess(res, await usersService.createStaff(req.body, currentUser(res.locals).role), 201);
};

export const updateStaff: RequestHandler = async (req, res) => {
  const member = await usersService.updateStaff(String(req.params.id), req.body, currentUser(res.locals));
  // A new password or a disabled account ends every session of that person.
  if (req.body.password || req.body.isActive === false) await authService.revokeSessions(member.id);
  sendSuccess(res, member);
};

export const resetLink: RequestHandler = async (req, res) => {
  sendSuccess(res, await createResetLink(String(req.params.id)), 201);
};
