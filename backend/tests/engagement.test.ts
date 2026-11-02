import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { CART_ID_HEADER } from "@nosa/contracts";
import { CategoryModel } from "@/modules/categories/categories.model";
import { ProductModel } from "@/modules/products/products.model";
import { seedGovernorates } from "@/modules/shipping/shipping.service";
import { api, bearer, createUser } from "./helpers";

let productId: string;

beforeEach(async () => {
  await seedGovernorates();
  const category = await CategoryModel.create({ name: { ar: "شنط", en: "Bags" }, slug: "bags" });
  productId = (
    await ProductModel.create({
      category: category._id,
      status: "published",
      name: { ar: "شنطة", en: "Bag" },
      slug: "bag",
      description: { ar: "وصف", en: "Description" },
      price: 500,
      stock: 5,
    })
  ).id;
});

/** Places an order as the given user and walks it to "delivered". */
async function deliverOrder(token: string) {
  const cart = { [CART_ID_HEADER]: `guest-${randomUUID()}` };
  await api().post("/api/v1/cart/items").set(bearer(token)).set(cart).send({ productId, quantity: 2 });
  const order = await api()
    .post("/api/v1/orders")
    .set(bearer(token))
    .send({
      contact: { name: "Mona", phone: "01012345678" },
      paymentMethod: "cod",
    });
  const staff = await createUser("staff");
  for (const status of ["confirmed", "ready", "shipped", "delivered"]) {
    await api().patch(`/api/v1/dashboard/orders/${order.body.data.id}/status`).set(bearer(staff.token)).send({ status, ...(status === "confirmed" && { delivery: { scope: "domestic", governorate: "القاهرة", city: "مدينة نصر", street: "شارع عباس العقاد ١٢" } }) });
  }
  return order.body.data;
}

describe("reviews", () => {
  it("only lets customers who received the product review it, then shows it after approval", async () => {
    const buyer = await createUser();
    const stranger = await createUser();
    const review = { rating: 4, body: "Beautiful work, my daughter loves it" };

    expect((await api().post("/api/v1/products/bag/reviews").set(bearer(stranger.token)).send(review)).status).toBe(403);

    await deliverOrder(buyer.token);
    const created = await api().post("/api/v1/products/bag/reviews").set(bearer(buyer.token)).send(review);
    expect(created.status).toBe(201);
    expect(created.body.data.isVerifiedPurchase).toBe(true);
    expect((await api().get("/api/v1/products/bag/reviews")).body.meta.total).toBe(0);

    const editor = await createUser("editor");
    await api().patch(`/api/v1/dashboard/reviews/${created.body.data.id}`).set(bearer(editor.token)).send({ status: "approved" });

    expect((await api().get("/api/v1/products/bag/reviews")).body.meta.total).toBe(1);
    expect((await api().get("/api/v1/products/bag")).body.data.rating).toEqual({ average: 4, count: 1 });

    const twice = await api().post("/api/v1/products/bag/reviews").set(bearer(buyer.token)).send(review);
    expect(twice.status).toBe(409);
  });
});

describe("wishlist", () => {
  it("toggles a product on and off", async () => {
    const { token } = await createUser();
    const on = await api().post("/api/v1/wishlist/toggle").set(bearer(token)).send({ productId });
    expect(on.body.data.saved).toBe(true);
    expect((await api().get("/api/v1/wishlist").set(bearer(token))).body.data.items[0].slug).toBe("bag");

    const off = await api().post("/api/v1/wishlist/toggle").set(bearer(token)).send({ productId });
    expect(off.body.data.saved).toBe(false);
  });
});

describe("custom orders", () => {
  it("goes from request to quote to the customer's acceptance", async () => {
    const customer = await createUser();
    const created = await api()
      .post("/api/v1/custom-orders")
      .set(bearer(customer.token))
      .send({
        contact: { name: "Mona", phone: "01012345678" },
        type: "dress_set",
        description: "A red and white dress set for my daughter's first birthday",
        sizes: "1-2y",
        budget: 1500,
      });
    expect(created.status).toBe(201);
    expect(created.body.data.number).toMatch(/^CUS-\d{4}-\d{5}$/);

    const staff = await createUser("staff");
    const quoted = await api()
      .post(`/api/v1/dashboard/custom-orders/${created.body.data.id}/quote`)
      .set(bearer(staff.token))
      .send({ price: 1300, productionDays: 7, message: "Ready in a week" });
    expect(quoted.body.data.status).toBe("quoted");

    const accepted = await api()
      .post(`/api/v1/custom-orders/me/${created.body.data.number}/respond`)
      .set(bearer(customer.token))
      .send({ accept: true });
    expect(accepted.body.data.status).toBe("accepted");

    const invalid = await api()
      .patch(`/api/v1/dashboard/custom-orders/${created.body.data.id}/status`)
      .set(bearer(staff.token))
      .send({ status: "delivered" });
    expect(invalid.status).toBe(409);
  });
});

describe("cms", () => {
  it("validates sections by type and cleans page HTML", async () => {
    const editor = await createUser("editor");

    const bad = await api()
      .post("/api/v1/dashboard/cms/home")
      .set(bearer(editor.token))
      .send({ content: { type: "products", title: { ar: "الأكتر مبيعاً", en: "Best sellers" }, source: "everything" } });
    expect(bad.status).toBe(422);

    const good = await api()
      .post("/api/v1/dashboard/cms/home")
      .set(bearer(editor.token))
      .send({ content: { type: "products", title: { ar: "الأكتر مبيعاً", en: "Best sellers" }, source: "bestsellers" } });
    expect(good.status).toBe(201);
    expect((await api().get("/api/v1/cms/home")).body.data[0].content.limit).toBe(8);

    await api()
      .put("/api/v1/dashboard/cms/pages")
      .set(bearer(editor.token))
      .send({
        slug: "about",
        title: { ar: "من نحن", en: "About us" },
        body: { ar: "<p>أهلاً</p><script>alert(1)</script>", en: '<p onclick="x()">Hello <a href="javascript:alert(1)">x</a></p>' },
      });
    const page = (await api().get("/api/v1/cms/pages/about")).body.data;
    expect(page.body.ar).toBe("<p>أهلاً</p>");
    expect(page.body.en).not.toMatch(/onclick|javascript/);
  });
});

describe("analytics", () => {
  it("summarises revenue, orders and top products for admins only", async () => {
    const buyer = await createUser();
    await deliverOrder(buyer.token);

    const staff = await createUser("staff");
    expect((await api().get("/api/v1/dashboard/analytics/overview").set(bearer(staff.token))).status).toBe(403);

    const owner = await createUser("owner");
    const res = await api().get("/api/v1/dashboard/analytics/overview?days=7").set(bearer(owner.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      revenue: 1000,
      orders: 1,
      averageOrderValue: 1000,
      ordersByStatus: { delivered: 1 },
      topProducts: [{ slug: "bag", quantity: 2, revenue: 1000 }],
    });
    expect(res.body.data.revenueByDay).toHaveLength(1);
  });
});
