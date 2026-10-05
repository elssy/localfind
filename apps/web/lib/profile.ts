import type { Role } from "@prisma/client";
import { prisma } from "./db";
import type { ProviderProfileInput, SeekerProfileInput } from "./profileSchemas";

export {
  providerProfileSchema,
  seekerProfileSchema,
  CATEGORY_NAMES,
} from "./profileSchemas";
export type { ProviderProfileInput, SeekerProfileInput } from "./profileSchemas";

export class ProfileAlreadyExistsError extends Error {
  constructor() {
    super("Profile already exists");
    this.name = "ProfileAlreadyExistsError";
  }
}

// Admins have no marketplace profile, so they are always treated as complete.
// This keeps the onboarding check simple for every caller, whatever the role.
export async function getProfileStatus(userId: string, role: Role) {
  if (role === "provider") {
    const profile = await prisma.provider.findUnique({ where: { userId } });
    return { hasProfile: !!profile, profile };
  }
  if (role === "seeker") {
    const profile = await prisma.seeker.findUnique({ where: { userId } });
    return { hasProfile: !!profile, profile };
  }
  return { hasProfile: true, profile: null };
}

export async function createProviderProfile(userId: string, data: ProviderProfileInput) {
  const existing = await prisma.provider.findUnique({ where: { userId } });
  if (existing) throw new ProfileAlreadyExistsError();
  return prisma.provider.create({ data: { userId, ...data } });
}

// The where clause is always built from userId, the caller's own identity,
// never from anything in the request body. That makes it structurally
// impossible for this function to update someone else's profile.
export async function updateProviderProfile(
  userId: string,
  data: Partial<ProviderProfileInput>
) {
  return prisma.provider.update({ where: { userId }, data });
}

export async function createSeekerProfile(userId: string, data: SeekerProfileInput) {
  const existing = await prisma.seeker.findUnique({ where: { userId } });
  if (existing) throw new ProfileAlreadyExistsError();
  return prisma.seeker.create({ data: { userId, ...data } });
}

export async function updateSeekerProfile(userId: string, data: Partial<SeekerProfileInput>) {
  return prisma.seeker.update({ where: { userId }, data });
}
