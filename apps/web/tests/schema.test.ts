import { describe, it, expect } from "vitest";
import { prisma } from "../lib/db";
import { randomUUID } from "crypto";

async function createTestUser(role: "seeker" | "provider" = "seeker") {
  return prisma.user.create({
    data: {
      name: "Test User",
      email: `test-${randomUUID()}@example.com`,
      phone: "+254700000000",
      passwordHash: "not-a-real-hash",
      role,
    },
  });
}

describe("Provider", () => {
  it("enforces one provider profile per user", async () => {
    const user = await createTestUser("provider");
    await prisma.provider.create({
      data: { userId: user.id, businessName: "Test Biz", category: "plumbing" },
    });

    await expect(
      prisma.provider.create({
        data: { userId: user.id, businessName: "Duplicate", category: "plumbing" },
      })
    ).rejects.toThrow();

    await prisma.provider.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});

describe("Bid", () => {
  it("prevents a provider from bidding twice on the same job", async () => {
    const seeker = await createTestUser("seeker");
    const providerUser = await createTestUser("provider");
    const provider = await prisma.provider.create({
      data: { userId: providerUser.id, businessName: "Biz", category: "plumbing" },
    });
    const job = await prisma.job.create({
      data: { seekerId: seeker.id, category: "plumbing", description: "Fix a leak" },
    });

    await prisma.bid.create({
      data: { jobId: job.id, providerId: provider.id, amountKES: 5000 },
    });

    await expect(
      prisma.bid.create({
        data: { jobId: job.id, providerId: provider.id, amountKES: 6000 },
      })
    ).rejects.toThrow();

    await prisma.bid.deleteMany({ where: { jobId: job.id } });
    await prisma.job.delete({ where: { id: job.id } });
    await prisma.provider.delete({ where: { id: provider.id } });
    await prisma.user.deleteMany({ where: { id: { in: [seeker.id, providerUser.id] } } });
  });
});

describe("Transaction financial integrity", () => {
  it("blocks deleting a user who has an existing transaction", async () => {
    const seeker = await createTestUser("seeker");
    const providerUser = await createTestUser("provider");
    const provider = await prisma.provider.create({
      data: { userId: providerUser.id, businessName: "Biz", category: "cleaning" },
    });
    const job = await prisma.job.create({
      data: { seekerId: seeker.id, category: "cleaning", description: "Deep clean" },
    });
    const bid = await prisma.bid.create({
      data: { jobId: job.id, providerId: provider.id, amountKES: 3000 },
    });
    const transaction = await prisma.transaction.create({
      data: {
        bidId: bid.id,
        seekerId: seeker.id,
        providerId: providerUser.id,
        amountKES: 3000,
      },
    });

    await expect(prisma.user.delete({ where: { id: seeker.id } })).rejects.toThrow();

    await prisma.transaction.delete({ where: { id: transaction.id } });
    await prisma.bid.delete({ where: { id: bid.id } });
    await prisma.job.delete({ where: { id: job.id } });
    await prisma.provider.delete({ where: { id: provider.id } });
    await prisma.user.deleteMany({ where: { id: { in: [seeker.id, providerUser.id] } } });
  });
});

describe("Dispute", () => {
  it("allows only one dispute per transaction", async () => {
    const seeker = await createTestUser("seeker");
    const providerUser = await createTestUser("provider");
    const provider = await prisma.provider.create({
      data: { userId: providerUser.id, businessName: "Biz", category: "electrical" },
    });
    const job = await prisma.job.create({
      data: { seekerId: seeker.id, category: "electrical", description: "Wiring" },
    });
    const bid = await prisma.bid.create({
      data: { jobId: job.id, providerId: provider.id, amountKES: 8000 },
    });
    const transaction = await prisma.transaction.create({
      data: { bidId: bid.id, seekerId: seeker.id, providerId: providerUser.id, amountKES: 8000 },
    });

    await prisma.dispute.create({
      data: { transactionId: transaction.id, raisedById: seeker.id, reason: "Not completed" },
    });

    await expect(
      prisma.dispute.create({
        data: { transactionId: transaction.id, raisedById: seeker.id, reason: "Duplicate attempt" },
      })
    ).rejects.toThrow();

    await prisma.dispute.deleteMany({ where: { transactionId: transaction.id } });
    await prisma.transaction.delete({ where: { id: transaction.id } });
    await prisma.bid.delete({ where: { id: bid.id } });
    await prisma.job.delete({ where: { id: job.id } });
    await prisma.provider.delete({ where: { id: provider.id } });
    await prisma.user.deleteMany({ where: { id: { in: [seeker.id, providerUser.id] } } });
  });
});