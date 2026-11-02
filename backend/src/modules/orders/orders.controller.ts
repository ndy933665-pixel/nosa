import type { RequestHandler } from "express";
import { CART_ID_HEADER, IDEMPOTENCY_HEADER } from "@nosa/contracts";
import { sendSuccess } from "@/shared/http/api-response";
import { currentUser } from "@/shared/middlewares/auth";
import * as service from "./orders.service";

const KEY = /^[\w-]{16,64}$/;

export const checkout: RequestHandler = async (req, res) => {
  const guestId = req.header(CART_ID_HEADER);
  const idempotencyKey = req.header(IDEMPOTENCY_HEADER);
  const order = await service.checkout(
    { userId: res.locals.user?.id, guestId: guestId && KEY.test(guestId) ? guestId : undefined },
    req.body,
    idempotencyKey && KEY.test(idempotencyKey) ? idempotencyKey : undefined,
  );
  sendSuccess(res, order, 201);
};

export const mine: RequestHandler = async (_req, res) => {
  sendSuccess(res, await service.listMyOrders(currentUser(res.locals).id));
};

export const myOrder: RequestHandler = async (req, res) => {
  sendSuccess(res, await service.getMyOrder(currentUser(res.locals).id, String(req.params.number)));
};

export const track: RequestHandler = async (req, res) => {
  sendSuccess(res, await service.trackOrder(req.body.number, req.body.phone));
};

export const list: RequestHandler = async (_req, res) => {
  const { items, meta } = await service.listOrders(res.locals.query as Parameters<typeof service.listOrders>[0]);
  sendSuccess(res, items, 200, meta);
};

export const detail: RequestHandler = async (req, res) => {
  sendSuccess(res, await service.getOrder(String(req.params.id)));
};

export const summary: RequestHandler = async (_req, res) => {
  sendSuccess(res, await service.countOrderGroups(res.locals.query as Parameters<typeof service.countOrderGroups>[0]));
};

export const customerCounts: RequestHandler = async (_req, res) => {
  sendSuccess(res, await service.countOrdersByPhones((res.locals.query as { phones: string[] }).phones));
};

export const updateStatus: RequestHandler = async (req, res) => {
  sendSuccess(
    res,
    await service.updateOrderStatus(String(req.params.id), req.body.status, currentUser(res.locals).id, req.body.note, req.body.delivery),
  );
};

export const updateDelivery: RequestHandler = async (req, res) => {
  sendSuccess(res, await service.updateOrderDelivery(String(req.params.id), req.body));
};

export const addNote: RequestHandler = async (req, res) => {
  sendSuccess(res, await service.addInternalNote(String(req.params.id), req.body.note, currentUser(res.locals).id));
};
