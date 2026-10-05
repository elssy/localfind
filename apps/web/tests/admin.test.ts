import { describe, it, expect, afterEach } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db";
import {
  listUsers,
  listProviders,
  applyProviderAction,
  getProviderDetail,
  getAdminStats,
} from "../lib/admin";

// Every row these tests create carries a unique tag in its name, so searches
// find only this test's rows, and each test removes what it made.
const created: { users: string[] } = { users: [] };

async function makeUser(role: "seeker" | "provider" | "admin", tag: string, name = "Test Person") {
  const user = await prisma.user.create({
    data: {
      name: `${name} ${tag}`,
      email: `test-${randomUUID()}@example.com`,
      phone: "+254700000000",
      passwordHash: "not-a-real-hash",
      role,
    },
  });
  created.users.push(user.id);
  return user;
}

async function makeProvider(tag: string, category = "Auto Services") {
  const user = await makeUser("provider", tag, "Owner");
  const provider = await prisma.provider.create({
    data: { userId: user.id, businessName: `Biz ${tag}`, category, city: "Nairobi" },
  });
  return { user, provider };
}

afterEach(async () => {
  const ids = created.users.splice(0);
  if (ids.length === 0) return;
  // Providers and sessions are removed with their user (cascade).
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
});

describe("listUsers", () => {
  it("lists seekers and providers but never admins", async () => {
    const tag = randomUUID().slice(0, 8);
    await makeUser("seeker", tag);
    await makeUser("provider", tag);
    await makeUser("admin", tag);

    const result = await listUsers({ q: tag, page: 1, pageSize: 20 });
    const roles = result.items.map((u) => u.role).sort();
    expect(roles).toEqual(["provider", "seeker"]);
    expect(result.total).toBe(2);
  });

  it("filters by role", async () => {
    const tag = randomUUID().slice(0, 8);
    await makeUser("seeker", tag);
    await makeUser("provider", tag);

    const result = await listUsers({ role: "seeker", q: tag, page: 1, pageSize: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].role).toBe("seeker");
  });

  it("never returns the password hash", async () => {
    const tag = randomUUID().slice(0, 8);
    await makeUser("seeker", tag);
    const result = await listUsers({ q: tag, page: 1, pageSize: 20 });
    expect(Object.keys(result.items[0])).not.toContain("passwordHash");
  });

  it("searches by name, email and is not case sensitive", async () => {
    const tag = randomUUID().slice(0, 8);
    const user = await makeUser("seeker", tag);
    expect((await listUsers({ q: tag.toUpperCase(), page: 1, pageSize: 20 })).total).toBe(1);
    expect((await listUsers({ q: user.email, page: 1, pageSize: 20 })).total).toBe(1);
  });

  it("splits results into pages and reports the full total", async () => {
    const tag = randomUUID().slice(0, 8);
    for (let i = 0; i < 3; i++) await makeUser("seeker", tag);

    const first = await listUsers({ q: tag, page: 1, pageSize: 2 });
    const second = await listUsers({ q: tag, page: 2, pageSize: 2 });
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(1);
    expect(first.total).toBe(3);
    const allIds = [...first.items, ...second.items].map((u) => u.id);
    expect(new Set(allIds).size).toBe(3);
  });
});

describe("listProviders", () => {
  it("shows the real business, owner and a pending status for a new provider", async () => {
    const tag = randomUUID().slice(0, 8);
    await makeProvider(tag);

    const result = await listProviders({ q: tag, page: 1, pageSize: 20 });
    expect(result.items).toHaveLength(1);
    const row = result.items[0];
    expect(row.businessName).toBe(`Biz ${tag}`);
    expect(row.owner.name).toContain(tag);
    expect(row.status).toBe("pending");
  });

  it("filters by status, including suspended accounts", async () => {
    const tag = randomUUID().slice(0, 8);
    const a = await makeProvider(tag);
    const b = await makeProvider(tag);
    await applyProviderAction(a.provider.id, "approve");
    await applyProviderAction(b.provider.id, "suspend");

    const active = await listProviders({ status: "active", q: tag, page: 1, pageSize: 20 });
    const suspended = await listProviders({ status: "suspended", q: tag, page: 1, pageSize: 20 });
    const pending = await listProviders({ status: "pending", q: tag, page: 1, pageSize: 20 });
    expect(active.items.map((p) => p.id)).toEqual([a.provider.id]);
    expect(suspended.items.map((p) => p.id)).toEqual([b.provider.id]);
    expect(pending.total).toBe(0);
  });

  it("filters by category", async () => {
    const tag = randomUUID().slice(0, 8);
    await makeProvider(tag, "Auto Services");
    await makeProvider(tag, "Home Services");

    const result = await listProviders({ category: "Home Services", q: tag, page: 1, pageSize: 20 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0].category).toBe("Home Services");
  });

  it("finds a provider by the owner's email", async () => {
    const tag = randomUUID().slice(0, 8);
    const { user } = await makeProvider(tag);
    const result = await listProviders({ q: user.email, page: 1, pageSize: 20 });
    expect(result.total).toBe(1);
  });
});

describe("applyProviderAction", () => {
  it("approves and rejects a provider", async () => {
    const { provider } = await makeProvider(randomUUID().slice(0, 8));

    const approved = await applyProviderAction(provider.id, "approve");
    expect(approved).toMatchObject({ status: "active", verificationStatus: "verified" });

    const rejected = await applyProviderAction(provider.id, "reject");
    expect(rejected).toMatchObject({ status: "rejected", verificationStatus: "rejected" });
  });

  it("suspending switches the account off and ends every open session", async () => {
    const { user, provider } = await makeProvider(randomUUID().slice(0, 8));
    await prisma.session.create({
      data: { tokenHash: randomUUID(), userId: user.id, expiresAt: new Date(Date.now() + 86_400_000) },
    });

    const result = await applyProviderAction(provider.id, "suspend");
    expect(result?.status).toBe("suspended");

    const owner = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(owner.disabled).toBe(true);
    expect(await prisma.session.count({ where: { userId: user.id } })).toBe(0);
  });

  it("reinstating switches the account back on and shows the earlier review result", async () => {
    const { user, provider } = await makeProvider(randomUUID().slice(0, 8));
    await applyProviderAction(provider.id, "approve");
    await applyProviderAction(provider.id, "suspend");

    const result = await applyProviderAction(provider.id, "reinstate");
    expect(result?.status).toBe("active");
    const owner = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(owner.disabled).toBe(false);
  });

  it("returns null for a provider that does not exist", async () => {
    expect(await applyProviderAction("does-not-exist", "approve")).toBeNull();
  });

  it("only touches the provider it was asked about", async () => {
    const tag = randomUUID().slice(0, 8);
    const a = await makeProvider(tag);
    const b = await makeProvider(tag);
    await applyProviderAction(a.provider.id, "suspend");

    const other = await prisma.user.findUniqueOrThrow({ where: { id: b.user.id } });
    expect(other.disabled).toBe(false);
  });
});

describe("getProviderDetail", () => {
  it("returns the profile with the owner, and real zero counts for a new provider", async () => {
    const tag = randomUUID().slice(0, 8);
    const { provider } = await makeProvider(tag);

    const detail = await getProviderDetail(provider.id);
    expect(detail).not.toBeNull();
    expect(detail!.businessName).toBe(`Biz ${tag}`);
    expect(detail!.owner.name).toContain(tag);
    expect(detail!.stats).toEqual({ bidsSubmitted: 0, jobsWon: 0, feesGeneratedKES: 0 });
    expect(detail!.tokenBalance).toBe(0);
    expect(detail!.reviews).toEqual([]);
    expect(detail!.transactions).toEqual([]);
    expect(Object.keys(detail!.owner)).not.toContain("passwordHash");
  });

  it("counts bids and sums the fee on this provider's own transactions only", async () => {
    const tag = randomUUID().slice(0, 8);
    const seeker = await makeUser("seeker", tag);
    const mine = await makeProvider(tag);
    const other = await makeProvider(tag);
    const job = await prisma.job.create({
      data: { seekerId: seeker.id, category: "Auto Services", description: "Fix brakes" },
    });
    const myBid = await prisma.bid.create({
      data: { jobId: job.id, providerId: mine.provider.id, amountKES: 5000 },
    });
    await prisma.bid.create({ data: { jobId: job.id, providerId: other.provider.id, amountKES: 6000 } });
    const tx = await prisma.transaction.create({
      data: {
        bidId: myBid.id,
        seekerId: seeker.id,
        providerId: mine.user.id,
        amountKES: 5000,
        feeKES: 250,
      },
    });

    const detail = await getProviderDetail(mine.provider.id);
    expect(detail!.stats).toEqual({ bidsSubmitted: 1, jobsWon: 1, feesGeneratedKES: 250 });
    expect(detail!.transactions.map((t) => t.id)).toEqual([tx.id]);

    // Money records must outlive the cleanup order: remove them before the users.
    await prisma.transaction.delete({ where: { id: tx.id } });
    await prisma.bid.deleteMany({ where: { jobId: job.id } });
    await prisma.job.delete({ where: { id: job.id } });
  });

  it("returns null for a provider that does not exist", async () => {
    expect(await getProviderDetail("does-not-exist")).toBeNull();
  });
});

describe("getAdminStats", () => {
  it("counts new providers and seekers and lists recent sign ups", async () => {
    const before = await getAdminStats();
    const tag = randomUUID().slice(0, 8);
    await makeProvider(tag);
    await makeUser("seeker", tag);

    const after = await getAdminStats();
    expect(after.totalProviders).toBe(before.totalProviders + 1);
    expect(after.newProvidersLast30Days).toBe(before.newProvidersLast30Days + 1);
    expect(after.totalSeekers).toBe(before.totalSeekers + 1);
    expect(after.pendingVerifications).toBe(before.pendingVerifications + 1);
    expect(after.recentSignups.length).toBeLessThanOrEqual(8);
    expect(after.recentSignups.some((u) => u.name.includes(tag))).toBe(true);
  });

  it("stops counting a provider as pending once approved", async () => {
    const { provider } = await makeProvider(randomUUID().slice(0, 8));
    const pending = (await getAdminStats()).pendingVerifications;
    await applyProviderAction(provider.id, "approve");
    expect((await getAdminStats()).pendingVerifications).toBe(pending - 1);
  });

  it("reports money fields as plain numbers, zero when nothing has happened", async () => {
    const stats = await getAdminStats();
    expect(typeof stats.escrowVolumeKES).toBe("number");
    expect(typeof stats.revenueKES).toBe("number");
    expect(typeof stats.openDisputes).toBe("number");
  });
});
