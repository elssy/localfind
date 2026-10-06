import { describe, it, expect, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db";
import {
  AlreadyBidError,
  BidNotAvailableError,
  CategoryMismatchError,
  JobClosedError,
  JobNotFoundError,
  NotAProviderError,
  ProviderNotApprovedError,
  acceptBid,
  createJob,
  getPublicProvider,
  getSeekerJobBids,
  listOrders,
  listProviderAlerts,
  listPublicProviders,
  listSeekerJobs,
  placeBid,
} from "../lib/marketplace";

// Everything a test creates is tracked and removed afterwards, in the order the
// database requires (money records first, people last).
const userIds: string[] = [];

async function makeUser(role: "seeker" | "provider", tag: string, name = "Person") {
  const user = await prisma.user.create({
    data: {
      name: `${name} ${tag}`,
      email: `test-${randomUUID()}@example.com`,
      phone: "+254700000000",
      passwordHash: "not-a-real-hash",
      role,
    },
  });
  userIds.push(user.id);
  return user;
}

async function makeProvider(
  tag: string,
  opts: { category?: string; status?: "pending" | "verified" | "rejected"; disabled?: boolean; name?: string } = {}
) {
  const user = await makeUser("provider", tag, opts.name ?? "Owner");
  if (opts.disabled) await prisma.user.update({ where: { id: user.id }, data: { disabled: true } });
  const provider = await prisma.provider.create({
    data: {
      userId: user.id,
      businessName: `Biz ${tag} ${randomUUID().slice(0, 4)}`,
      category: opts.category ?? "Beauty & Wellness",
      city: "Nairobi",
      verificationStatus: opts.status ?? "verified",
    },
  });
  return { user, provider };
}

async function makeJob(seekerId: string, category = "Beauty & Wellness", description = "Gel nails") {
  return createJob(seekerId, { category, description });
}

afterEach(async () => {
  const ids = userIds.splice(0);
  if (ids.length === 0) return;
  await prisma.review.deleteMany({ where: { authorId: { in: ids } } });
  await prisma.transaction.deleteMany({ where: { OR: [{ seekerId: { in: ids } }, { providerId: { in: ids } }] } });
  await prisma.job.deleteMany({ where: { seekerId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

const tagOf = () => randomUUID().slice(0, 8);

describe("listPublicProviders", () => {
  it("shows only approved providers whose account is on", async () => {
    const tag = tagOf();
    const ok = await makeProvider(tag, { name: "Visible" });
    await makeProvider(tag, { status: "pending" });
    await makeProvider(tag, { status: "rejected" });
    await makeProvider(tag, { disabled: true });

    const result = await listPublicProviders({ q: tag, page: 1, pageSize: 20 });
    expect(result.items.map((p) => p.id)).toEqual([ok.provider.id]);
    expect(result.total).toBe(1);
  });

  it("never includes the owner's contact details or account fields", async () => {
    const tag = tagOf();
    await makeProvider(tag);
    const { items } = await listPublicProviders({ q: tag, page: 1, pageSize: 20 });
    const keys = Object.keys(items[0]);
    for (const secret of ["email", "phone", "userId", "user", "passwordHash"]) {
      expect(keys).not.toContain(secret);
    }
  });

  it("filters by category and by text", async () => {
    const tag = tagOf();
    await makeProvider(tag, { category: "Auto Services" });
    await makeProvider(tag, { category: "Home Services" });

    const auto = await listPublicProviders({ category: "Auto Services", q: tag, page: 1, pageSize: 20 });
    expect(auto.items).toHaveLength(1);
    expect(auto.items[0].category).toBe("Auto Services");

    const byText = await listPublicProviders({ q: `${tag} `.trim().toUpperCase(), page: 1, pageSize: 20 });
    expect(byText.total).toBe(2);
  });

  it("splits into pages and reports the full total", async () => {
    const tag = tagOf();
    for (let i = 0; i < 3; i++) await makeProvider(tag);
    const first = await listPublicProviders({ q: tag, page: 1, pageSize: 2 });
    const second = await listPublicProviders({ q: tag, page: 2, pageSize: 2 });
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(1);
    expect(first.total).toBe(3);
  });

  it("reports the real average rating and review count", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const { provider, user } = await makeProvider(tag);
    for (const rating of [5, 4]) {
      const job = await makeJob(seeker.id);
      const bid = await prisma.bid.create({ data: { jobId: job.id, providerId: provider.id, amountKES: 1000 } });
      const tx = await prisma.transaction.create({
        data: { bidId: bid.id, seekerId: seeker.id, providerId: user.id, amountKES: 1000, status: "released" },
      });
      await prisma.review.create({
        data: { transactionId: tx.id, authorId: seeker.id, providerId: provider.id, rating },
      });
    }
    const { items } = await listPublicProviders({ q: tag, page: 1, pageSize: 20 });
    expect(items[0]).toMatchObject({ rating: 4.5, reviewCount: 2 });
  });

  it("shows zero rating and zero reviews for a new provider, not made up numbers", async () => {
    const tag = tagOf();
    await makeProvider(tag);
    const { items } = await listPublicProviders({ q: tag, page: 1, pageSize: 20 });
    expect(items[0]).toMatchObject({ rating: 0, reviewCount: 0 });
  });
});

describe("getPublicProvider", () => {
  it("returns an approved provider with reviews that show shortened author names", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag, "Wanjiru");
    const { provider, user } = await makeProvider(tag);
    const job = await makeJob(seeker.id);
    const bid = await prisma.bid.create({ data: { jobId: job.id, providerId: provider.id, amountKES: 1000 } });
    const tx = await prisma.transaction.create({
      data: { bidId: bid.id, seekerId: seeker.id, providerId: user.id, amountKES: 1000, status: "released" },
    });
    await prisma.review.create({
      data: { transactionId: tx.id, authorId: seeker.id, providerId: provider.id, rating: 5, comment: "Great" },
    });

    const result = await getPublicProvider(provider.id);
    expect(result!.reviews).toHaveLength(1);
    // The seeker is called "Wanjiru <tag>", so only the first letter of the tag may appear.
    expect(result!.reviews[0].authorName).toBe(`Wanjiru ${tag.charAt(0).toUpperCase()}.`);
    expect(Object.keys(result!)).not.toContain("userId");
  });

  it("returns null for a pending, rejected, suspended or missing provider", async () => {
    const tag = tagOf();
    for (const opts of [{ status: "pending" as const }, { status: "rejected" as const }, { disabled: true }]) {
      const { provider } = await makeProvider(tag, opts);
      expect(await getPublicProvider(provider.id)).toBeNull();
    }
    expect(await getPublicProvider("does-not-exist")).toBeNull();
  });
});

describe("requests and bids seen by the seeker", () => {
  it("lists only my own requests, newest first, with the bid count", async () => {
    const tag = tagOf();
    const me = await makeUser("seeker", tag);
    const other = await makeUser("seeker", tag);
    const { provider } = await makeProvider(tag);
    const mine = await makeJob(me.id, "Beauty & Wellness", "Gel nails");
    await makeJob(other.id);
    await prisma.bid.create({ data: { jobId: mine.id, providerId: provider.id, amountKES: 900 } });

    const jobs = await listSeekerJobs(me.id);
    expect(jobs.map((j) => j.id)).toEqual([mine.id]);
    expect(jobs[0].bidCount).toBe(1);
  });

  it("shows the bids on my request with each provider's public details only", async () => {
    const tag = tagOf();
    const me = await makeUser("seeker", tag);
    const { provider } = await makeProvider(tag);
    const job = await makeJob(me.id);
    await prisma.bid.create({ data: { jobId: job.id, providerId: provider.id, amountKES: 1200, message: "Today" } });

    const result = await getSeekerJobBids(me.id, job.id);
    expect(result!.bids).toHaveLength(1);
    expect(result!.bids[0]).toMatchObject({ amountKES: 1200, message: "Today", status: "pending" });
    expect(result!.bids[0].provider).toMatchObject({ id: provider.id, rating: 0, reviewCount: 0 });
    expect(Object.keys(result!.bids[0].provider)).not.toContain("userId");
  });

  it("answers 'not found' for someone else's request, and for one that does not exist", async () => {
    const tag = tagOf();
    const me = await makeUser("seeker", tag);
    const stranger = await makeUser("seeker", tag);
    const job = await makeJob(me.id);
    expect(await getSeekerJobBids(stranger.id, job.id)).toBeNull();
    expect(await getSeekerJobBids(me.id, "does-not-exist")).toBeNull();
  });
});

describe("listProviderAlerts", () => {
  it("shows open requests in the provider's own category and nothing else", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const { user } = await makeProvider(tag, { category: "Beauty & Wellness" });
    const match = await makeJob(seeker.id, "Beauty & Wellness");
    await makeJob(seeker.id, "Auto Services");

    const result = await listProviderAlerts(user.id);
    expect(result!.items.map((a) => a.id)).toContain(match.id);
    expect(result!.items.every((a) => a.category === "Beauty & Wellness")).toBe(true);
  });

  it("does not show a provider their own request", async () => {
    const tag = tagOf();
    const { user } = await makeProvider(tag);
    const own = await makeJob(user.id, "Beauty & Wellness");
    const result = await listProviderAlerts(user.id);
    expect(result!.items.map((a) => a.id)).not.toContain(own.id);
  });

  it("keeps a closed request in the list once the provider has bid on it, with the outcome", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const a = await makeProvider(tag);
    const b = await makeProvider(tag);
    const job = await makeJob(seeker.id);
    const bidA = await placeBid(a.user.id, job.id, { amountKES: 1000 });
    await placeBid(b.user.id, job.id, { amountKES: 1100 });
    await acceptBid(seeker.id, bidA.id);

    const forA = (await listProviderAlerts(a.user.id))!.items.find((x) => x.id === job.id)!;
    const forB = (await listProviderAlerts(b.user.id))!.items.find((x) => x.id === job.id)!;
    expect(forA.myBid?.status).toBe("accepted");
    expect(forB.myBid?.status).toBe("rejected");
    expect(forA.status).toBe("awarded");
  });

  it("says whether the provider may bid yet", async () => {
    const tag = tagOf();
    const approved = await makeProvider(tag);
    const waiting = await makeProvider(tag, { status: "pending" });
    const suspended = await makeProvider(tag, { disabled: true });
    expect((await listProviderAlerts(approved.user.id))!.canBid).toBe(true);
    expect((await listProviderAlerts(waiting.user.id))!.canBid).toBe(false);
    expect((await listProviderAlerts(suspended.user.id))!.canBid).toBe(false);
  });

  it("returns null for someone with no business profile", async () => {
    const seeker = await makeUser("seeker", tagOf());
    expect(await listProviderAlerts(seeker.id)).toBeNull();
  });
});

describe("placeBid", () => {
  it("lets an approved provider bid on an open request in their category", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const { user } = await makeProvider(tag);
    const job = await makeJob(seeker.id);
    const bid = await placeBid(user.id, job.id, { amountKES: 1500, message: "I can come today" });
    expect(bid).toMatchObject({ amountKES: 1500, message: "I can come today", status: "pending" });
  });

  it("refuses a provider who is not approved or is suspended", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const job = await makeJob(seeker.id);
    const waiting = await makeProvider(tag, { status: "pending" });
    const rejected = await makeProvider(tag, { status: "rejected" });
    const suspended = await makeProvider(tag, { disabled: true });
    for (const p of [waiting, rejected, suspended]) {
      await expect(placeBid(p.user.id, job.id, { amountKES: 1000 })).rejects.toBeInstanceOf(ProviderNotApprovedError);
    }
    expect(await prisma.bid.count({ where: { jobId: job.id } })).toBe(0);
  });

  it("refuses a bid outside the provider's category", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const { user } = await makeProvider(tag, { category: "Auto Services" });
    const job = await makeJob(seeker.id, "Beauty & Wellness");
    await expect(placeBid(user.id, job.id, { amountKES: 1000 })).rejects.toBeInstanceOf(CategoryMismatchError);
  });

  it("refuses a second bid from the same provider", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const { user } = await makeProvider(tag);
    const job = await makeJob(seeker.id);
    await placeBid(user.id, job.id, { amountKES: 1000 });
    await expect(placeBid(user.id, job.id, { amountKES: 900 })).rejects.toBeInstanceOf(AlreadyBidError);
    expect(await prisma.bid.count({ where: { jobId: job.id } })).toBe(1);
  });

  it("refuses a bid on a closed request", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const a = await makeProvider(tag);
    const b = await makeProvider(tag);
    const job = await makeJob(seeker.id);
    const bid = await placeBid(a.user.id, job.id, { amountKES: 1000 });
    await acceptBid(seeker.id, bid.id);
    await expect(placeBid(b.user.id, job.id, { amountKES: 800 })).rejects.toBeInstanceOf(JobClosedError);
  });

  it("refuses a bid on a request that does not exist, or on your own", async () => {
    const tag = tagOf();
    const { user } = await makeProvider(tag);
    await expect(placeBid(user.id, "does-not-exist", { amountKES: 1000 })).rejects.toBeInstanceOf(JobNotFoundError);
    const own = await makeJob(user.id);
    await expect(placeBid(user.id, own.id, { amountKES: 1000 })).rejects.toBeInstanceOf(JobNotFoundError);
  });

  it("refuses someone with no business profile", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const job = await makeJob(seeker.id);
    await expect(placeBid(seeker.id, job.id, { amountKES: 1000 })).rejects.toBeInstanceOf(NotAProviderError);
  });
});

describe("acceptBid", () => {
  async function setup() {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const a = await makeProvider(tag);
    const b = await makeProvider(tag);
    const job = await makeJob(seeker.id);
    const bidA = await placeBid(a.user.id, job.id, { amountKES: 2000 });
    const bidB = await placeBid(b.user.id, job.id, { amountKES: 1800 });
    return { seeker, a, b, job, bidA, bidB };
  }

  it("closes the request, accepts that bid, turns down the others and creates an unpaid order with the fee", async () => {
    const { seeker, a, job, bidA, bidB } = await setup();
    const order = await acceptBid(seeker.id, bidA.id);

    expect(order).toMatchObject({ amountKES: 2000, feeKES: 100, status: "pending" });
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("awarded");
    expect((await prisma.bid.findUniqueOrThrow({ where: { id: bidA.id } })).status).toBe("accepted");
    expect((await prisma.bid.findUniqueOrThrow({ where: { id: bidB.id } })).status).toBe("rejected");
    const stored = await prisma.transaction.findUniqueOrThrow({ where: { id: order!.id } });
    expect(stored).toMatchObject({ seekerId: seeker.id, providerId: a.user.id });
  });

  it("answers 'not found' for another seeker and changes nothing", async () => {
    const { job, bidA } = await setup();
    const stranger = await makeUser("seeker", tagOf());
    expect(await acceptBid(stranger.id, bidA.id)).toBeNull();
    expect((await prisma.job.findUniqueOrThrow({ where: { id: job.id } })).status).toBe("open");
    expect(await prisma.transaction.count({ where: { bidId: bidA.id } })).toBe(0);
  });

  it("answers 'not found' for a bid that does not exist", async () => {
    const seeker = await makeUser("seeker", tagOf());
    expect(await acceptBid(seeker.id, "does-not-exist")).toBeNull();
  });

  it("does not let the same request be accepted twice, or a turned-down bid be accepted", async () => {
    const { seeker, bidA, bidB } = await setup();
    await acceptBid(seeker.id, bidA.id);
    await expect(acceptBid(seeker.id, bidA.id)).rejects.toBeInstanceOf(BidNotAvailableError);
    await expect(acceptBid(seeker.id, bidB.id)).rejects.toBeInstanceOf(BidNotAvailableError);
    expect(await prisma.transaction.count({ where: { seekerId: seeker.id } })).toBe(1);
  });

  it("creates exactly one order when two accepts arrive at the same moment", async () => {
    const { seeker, bidA, bidB } = await setup();
    const results = await Promise.allSettled([acceptBid(seeker.id, bidA.id), acceptBid(seeker.id, bidB.id)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(await prisma.transaction.count({ where: { seekerId: seeker.id } })).toBe(1);
  });

  it("rounds the fee to whole shillings", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag);
    const { user } = await makeProvider(tag);
    const job = await makeJob(seeker.id);
    const bid = await placeBid(user.id, job.id, { amountKES: 1001 });
    const order = await acceptBid(seeker.id, bid.id);
    expect(order!.feeKES).toBe(50);
  });
});

describe("listOrders", () => {
  it("shows each side only their own orders, with the other party's name", async () => {
    const tag = tagOf();
    const seeker = await makeUser("seeker", tag, "Amina");
    const { user, provider } = await makeProvider(tag);
    const job = await makeJob(seeker.id, "Beauty & Wellness", "Gel nails for Saturday");
    const bid = await placeBid(user.id, job.id, { amountKES: 1500 });
    await acceptBid(seeker.id, bid.id);

    const mine = await listOrders(seeker.id, "seeker");
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({
      amountKES: 1500,
      status: "pending",
      service: "Gel nails for Saturday",
      providerProfileId: provider.id,
    });
    expect(mine[0].counterpartyName).toContain("Biz");

    const theirs = await listOrders(user.id, "provider");
    expect(theirs).toHaveLength(1);
    expect(theirs[0].counterpartyName).toBe(`Amina ${tag.charAt(0).toUpperCase()}.`);

    const stranger = await makeUser("seeker", tag);
    expect(await listOrders(stranger.id, "seeker")).toEqual([]);
    expect(await listOrders(seeker.id, "provider")).toEqual([]);
  });
});
