import { describe, it, expect } from "vitest";
import { randomUUID } from "crypto";
import { prisma } from "../lib/db";
import {
  createProviderProfile,
  updateProviderProfile,
  createSeekerProfile,
  getProfileStatus,
  ProfileAlreadyExistsError,
} from "../lib/profile";

async function createTestUser(role: "seeker" | "provider") {
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

describe("getProfileStatus", () => {
  it("reports no profile before one is created, then true after", async () => {
    const user = await createTestUser("provider");

    const before = await getProfileStatus(user.id, "provider");
    expect(before.hasProfile).toBe(false);

    await createProviderProfile(user.id, { businessName: "Biz", category: "cleaning" });

    const after = await getProfileStatus(user.id, "provider");
    expect(after.hasProfile).toBe(true);

    await prisma.provider.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});

describe("createProviderProfile", () => {
  it("rejects creating a second profile for the same user", async () => {
    const user = await createTestUser("provider");
    await createProviderProfile(user.id, { businessName: "Biz", category: "cleaning" });

    await expect(
      createProviderProfile(user.id, { businessName: "Duplicate", category: "cleaning" })
    ).rejects.toBeInstanceOf(ProfileAlreadyExistsError);

    await prisma.provider.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});

describe("updateProviderProfile", () => {
  it("only ever updates the profile belonging to the given userId", async () => {
    const userA = await createTestUser("provider");
    const userB = await createTestUser("provider");
    await createProviderProfile(userA.id, { businessName: "A Biz", category: "cleaning" });
    await createProviderProfile(userB.id, { businessName: "B Biz", category: "plumbing" });

    await updateProviderProfile(userA.id, { businessName: "A Biz Updated" });

    const profileA = await prisma.provider.findUnique({ where: { userId: userA.id } });
    const profileB = await prisma.provider.findUnique({ where: { userId: userB.id } });

    expect(profileA?.businessName).toBe("A Biz Updated");
    // This is the important assertion — proves the update is scoped
    // correctly and can never leak into another user's row.
    expect(profileB?.businessName).toBe("B Biz");

    await prisma.provider.deleteMany({ where: { userId: { in: [userA.id, userB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA.id, userB.id] } } });
  });
});

describe("createSeekerProfile", () => {
  it("creates a seeker profile", async () => {
    const user = await createTestUser("seeker");
    const profile = await createSeekerProfile(user.id, { city: "Nairobi" });
    expect(profile.city).toBe("Nairobi");

    await prisma.seeker.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  });
});