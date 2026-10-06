import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

type SessionUser = { id: string; role: "seeker" | "provider" | "admin" } | null;
let sessionUser: SessionUser = null;
let limitAllows = true;
const limitCalls: { key: string; failOpen: boolean }[] = [];

vi.mock("../lib/auth/session", () => ({ getSessionUser: async () => sessionUser }));
vi.mock("../lib/auth/rateLimit", () => ({
  searchLimiter: {},
  jobLimiter: {},
  bidLimiter: {},
  withinLimit: async (_limiter: unknown, key: string, options: { failOpen: boolean }) => {
    limitCalls.push({ key, failOpen: options.failOpen });
    return limitAllows;
  },
}));

import { prisma } from "../lib/db";
import { GET as listProvidersRoute } from "../app/api/providers/route";
import { GET as providerRoute } from "../app/api/providers/[id]/route";
import { GET as listJobsRoute, POST as createJobRoute } from "../app/api/jobs/route";
import { GET as jobBidsRoute, POST as placeBidRoute } from "../app/api/jobs/[id]/bids/route";
import { GET as alertsRoute } from "../app/api/provider/alerts/route";
import { POST as acceptRoute } from "../app/api/bids/[id]/accept/route";
import { GET as ordersRoute } from "../app/api/orders/route";

const userIds: string[] = [];
const tagOf = () => randomUUID().slice(0, 8);

async function makeUser(role: "seeker" | "provider", tag: string) {
  const user = await prisma.user.create({
    data: {
      name: `Person ${tag}`,
      email: `test-${randomUUID()}@example.com`,
      phone: "+254711222333",
      passwordHash: "not-a-real-hash",
      role,
    },
  });
  userIds.push(user.id);
  return user;
}

async function makeProvider(tag: string, status: "pending" | "verified" = "verified", category = "Beauty & Wellness") {
  const user = await makeUser("provider", tag);
  const provider = await prisma.provider.create({
    data: { userId: user.id, businessName: `Biz ${tag}`, category, city: "Nairobi", verificationStatus: status },
  });
  return { user, provider };
}

const as = (user: { id: string; role: "seeker" | "provider" | "admin" } | null) => {
  sessionUser = user ? { id: user.id, role: user.role } : null;
};

function req(url: string, method = "GET", body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
const ctx = (id: string) => ({ params: { id } });

beforeEach(() => {
  sessionUser = null;
  limitAllows = true;
  limitCalls.length = 0;
});

afterEach(async () => {
  const ids = userIds.splice(0);
  if (ids.length === 0) return;
  await prisma.review.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.transaction.deleteMany({ where: { OR: [{ seekerId: { in: ids } }, { providerId: { in: ids } }] } });
  await prisma.job.deleteMany({ where: { seekerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

describe("every marketplace route turns away signed-out visitors", () => {
  it("answers 401", async () => {
    as(null);
    const responses = await Promise.all([
      listProvidersRoute(req("/api/providers")),
      providerRoute(req("/api/providers/x"), ctx("x")),
      listJobsRoute(req("/api/jobs")),
      createJobRoute(req("/api/jobs", "POST", { category: "Beauty & Wellness", description: "Gel nails" })),
      jobBidsRoute(req("/api/jobs/x/bids"), ctx("x")),
      placeBidRoute(req("/api/jobs/x/bids", "POST", { amountKES: 100 }), ctx("x")),
      alertsRoute(req("/api/provider/alerts")),
      acceptRoute(req("/api/bids/x/accept", "POST"), ctx("x")),
      ordersRoute(req("/api/orders")),
    ]);
    expect(responses.map((r) => r.status)).toEqual(Array(9).fill(401));
  });
});

describe("provider directory", () => {
  it("returns only approved providers and never the owner's email or phone", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const ok = await makeProvider(tag, "verified");
    await makeProvider(tag, "pending");
    as(seeker);

    const res = await listProvidersRoute(req(`/api/providers?q=${tag}`));
    expect(res.status).toBe(200);
    const text = await res.text();
    const body = JSON.parse(text);
    expect(body.items.map((p: { id: string }) => p.id)).toEqual([ok.provider.id]);
    expect(text).not.toContain("@example.com");
    expect(text).not.toContain("+254711222333");
  });

  it("rejects an invalid search and counts the search against the person's limit", async () => {
    const seeker = await makeUser("seeker", tagOf());
    as(seeker);
    expect((await listProvidersRoute(req("/api/providers?category=Plumbing"))).status).toBe(400);
    await listProvidersRoute(req("/api/providers"));
    expect(limitCalls.at(-1)).toEqual({ key: seeker.id, failOpen: true });
  });

  it("answers 429 when the limit is used up", async () => {
    const seeker = await makeUser("seeker", tagOf());
    as(seeker);
    limitAllows = false;
    expect((await listProvidersRoute(req("/api/providers"))).status).toBe(429);
  });

  it("gives 404 for a pending provider's page", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const pending = await makeProvider(tag, "pending");
    as(seeker);
    expect((await providerRoute(req("/x"), ctx(pending.provider.id))).status).toBe(404);
  });
});

describe("making a request", () => {
  it("lets a seeker post a request", async () => {
    const seeker = await makeUser("seeker", tagOf());
    as(seeker);
    const res = await createJobRoute(req("/api/jobs", "POST", { category: "Beauty & Wellness", description: "Gel nails" }));
    expect(res.status).toBe(201);
    const { job } = await res.json();
    expect(await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).toMatchObject({ seekerId: seeker.id, status: "open" });
    expect(limitCalls.at(-1)).toEqual({ key: seeker.id, failOpen: false });
  });

  it("turns away providers, bad categories and short descriptions", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const { user: providerUser } = await makeProvider(tag);

    as(providerUser);
    expect((await createJobRoute(req("/api/jobs", "POST", { category: "Beauty & Wellness", description: "Gel nails" }))).status).toBe(403);

    as(seeker);
    const bad = await createJobRoute(req("/api/jobs", "POST", { category: "Plumbing", description: "Fix a tap" }));
    expect(bad.status).toBe(400);
    const short = await createJobRoute(req("/api/jobs", "POST", { category: "Beauty & Wellness", description: "hi" }));
    expect(short.status).toBe(400);
    expect((await short.json()).error).toContain("what you need");
    expect(await prisma.job.count({ where: { seekerId: seeker.id } })).toBe(0);
  });

  it("answers 429 and creates nothing when the limit is used up", async () => {
    const seeker = await makeUser("seeker", tagOf());
    as(seeker);
    limitAllows = false;
    const res = await createJobRoute(req("/api/jobs", "POST", { category: "Beauty & Wellness", description: "Gel nails" }));
    expect(res.status).toBe(429);
    expect(await prisma.job.count({ where: { seekerId: seeker.id } })).toBe(0);
  });

  it("lists only my own requests", async () => {
    const tag = tagOf();
    const me = await makeUser("seeker", tag);
    const other = await makeUser("seeker", tag);
    await prisma.job.create({ data: { seekerId: me.id, category: "Beauty & Wellness", description: "mine" } });
    await prisma.job.create({ data: { seekerId: other.id, category: "Beauty & Wellness", description: "theirs" } });
    as(me);
    const { items } = await (await listJobsRoute(req("/api/jobs"))).json();
    expect(items.map((j: { description: string }) => j.description)).toEqual(["mine"]);
  });
});

describe("bids", () => {
  async function scene() {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const provider = await makeProvider(tag);
    const job = await prisma.job.create({ data: { seekerId: seeker.id, category: "Beauty & Wellness", description: "Gel nails" } });
    return { tag, seeker, provider, job };
  }

  it("lets an approved provider bid, once", async () => {
    const { provider, job } = await scene();
    as(provider.user);
    const first = await placeBidRoute(req("/x", "POST", { amountKES: 1500, message: "Today" }), ctx(job.id));
    expect(first.status).toBe(201);
    const again = await placeBidRoute(req("/x", "POST", { amountKES: 1400 }), ctx(job.id));
    expect(again.status).toBe(409);
    expect((await again.json()).error).toContain("already");
    expect(limitCalls.at(-1)).toEqual({ key: provider.user.id, failOpen: false });
  });

  it("tells an unapproved provider why they cannot bid", async () => {
    const { tag, job } = await scene();
    const waiting = await makeProvider(tag, "pending");
    as(waiting.user);
    const res = await placeBidRoute(req("/x", "POST", { amountKES: 1500 }), ctx(job.id));
    expect(res.status).toBe(403);
    expect((await res.json()).error).toContain("approved");
    expect(await prisma.bid.count({ where: { jobId: job.id } })).toBe(0);
  });

  it("refuses seekers, other categories, closed requests, and bad amounts", async () => {
    const { tag, seeker, provider, job } = await scene();

    as(seeker);
    expect((await placeBidRoute(req("/x", "POST", { amountKES: 100 }), ctx(job.id))).status).toBe(403);

    const auto = await makeProvider(tag, "verified", "Auto Services");
    as(auto.user);
    expect((await placeBidRoute(req("/x", "POST", { amountKES: 100 }), ctx(job.id))).status).toBe(403);

    as(provider.user);
    for (const amountKES of [0, -5, 12.5, "100"]) {
      expect((await placeBidRoute(req("/x", "POST", { amountKES }), ctx(job.id))).status, String(amountKES)).toBe(400);
    }

    await prisma.job.update({ where: { id: job.id }, data: { status: "cancelled" } });
    expect((await placeBidRoute(req("/x", "POST", { amountKES: 100 }), ctx(job.id))).status).toBe(409);
    expect((await placeBidRoute(req("/x", "POST", { amountKES: 100 }), ctx("does-not-exist"))).status).toBe(404);
  });

  it("shows bids on a request only to the seeker who made it", async () => {
    const { tag, seeker, provider, job } = await scene();
    as(provider.user);
    await placeBidRoute(req("/x", "POST", { amountKES: 1500 }), ctx(job.id));

    const stranger = await makeUser("seeker", tag);
    as(stranger);
    expect((await jobBidsRoute(req("/x"), ctx(job.id))).status).toBe(404);

    as(provider.user);
    expect((await jobBidsRoute(req("/x"), ctx(job.id))).status).toBe(403);

    as(seeker);
    const res = await jobBidsRoute(req("/x"), ctx(job.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bids).toHaveLength(1);
    expect(body.bids[0].amountKES).toBe(1500);
  });
});

describe("accepting a bid", () => {
  async function bidScene() {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const provider = await makeProvider(tag);
    const job = await prisma.job.create({ data: { seekerId: seeker.id, category: "Beauty & Wellness", description: "Gel nails" } });
    const bid = await prisma.bid.create({ data: { jobId: job.id, providerId: provider.provider.id, amountKES: 2000 } });
    return { tag, seeker, provider, job, bid };
  }

  it("creates an unpaid order for the seeker who owns the request", async () => {
    const { seeker, bid } = await bidScene();
    as(seeker);
    const res = await acceptRoute(req("/x", "POST"), ctx(bid.id));
    expect(res.status).toBe(201);
    expect((await res.json()).order).toMatchObject({ amountKES: 2000, feeKES: 100, status: "pending" });
  });

  it("answers 404 to another seeker and leaves everything untouched", async () => {
    const { tag, job, bid } = await bidScene();
    const stranger = await makeUser("seeker", tag);
    as(stranger);
    expect((await acceptRoute(req("/x", "POST"), ctx(bid.id))).status).toBe(404);
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("open");
    expect(await prisma.transaction.count({ where: { bidId: bid.id } })).toBe(0);
  });

  it("refuses a provider, and a second accept of the same bid", async () => {
    const { seeker, provider, bid } = await bidScene();
    as(provider.user);
    expect((await acceptRoute(req("/x", "POST"), ctx(bid.id))).status).toBe(403);

    as(seeker);
    expect((await acceptRoute(req("/x", "POST"), ctx(bid.id))).status).toBe(201);
    expect((await acceptRoute(req("/x", "POST"), ctx(bid.id))).status).toBe(409);
  });
});

describe("provider alerts and orders", () => {
  it("gives a provider their alerts and refuses seekers", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const provider = await makeProvider(tag);
    await prisma.job.create({ data: { seekerId: seeker.id, category: "Beauty & Wellness", description: "Gel nails" } });

    as(provider.user);
    const res = await alertsRoute(req("/api/provider/alerts"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.canBid).toBe(true);
    expect(body.items.length).toBeGreaterThanOrEqual(1);

    as(seeker);
    expect((await alertsRoute(req("/api/provider/alerts"))).status).toBe(403);
  });

  it("shows each person only their own orders and refuses admins", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const provider = await makeProvider(tag);
    const job = await prisma.job.create({ data: { seekerId: seeker.id, category: "Beauty & Wellness", description: "Gel nails" } });
    const bid = await prisma.bid.create({ data: { jobId: job.id, providerId: provider.provider.id, amountKES: 1000 } });
    as(seeker);
    await acceptRoute(req("/x", "POST"), ctx(bid.id));

    const seekerOrders = (await (await ordersRoute(req("/api/orders"))).json()).items;
    expect(seekerOrders).toHaveLength(1);
    as(provider.user);
    expect((await (await ordersRoute(req("/api/orders"))).json()).items).toHaveLength(1);

    const stranger = await makeUser("seeker", tag);
    as(stranger);
    expect((await (await ordersRoute(req("/api/orders"))).json()).items).toEqual([]);

    as({ id: "a1", role: "admin" });
    expect((await ordersRoute(req("/api/orders"))).status).toBe(403);
  });
});
