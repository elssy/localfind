import { prisma } from "./db";
import { providerStatusWhere } from "./adminStatus";
import { ESCROW_FEE_RATE, shortName } from "@localfind/shared";
import type { CreateJobInput, PlaceBidInput } from "./marketplaceSchemas";

// Each of these is a rule the app must enforce, and the route turns it into a clear answer.
export class NotAProviderError extends Error {}
export class ProviderNotApprovedError extends Error {}
export class JobNotFoundError extends Error {}
export class JobClosedError extends Error {}
export class CategoryMismatchError extends Error {}
export class AlreadyBidError extends Error {}
export class BidNotAvailableError extends Error {}

const PUBLIC_REVIEW_LIMIT = 10;
const LIST_LIMIT = 50;

// Average rating and number of reviews for a set of providers, in one query.
async function ratingsFor(providerIds: string[]) {
  const map = new Map<string, { rating: number; reviewCount: number }>();
  if (providerIds.length === 0) return map;
  const groups = await prisma.review.groupBy({
    by: ["providerId"],
    where: { providerId: { in: providerIds } },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const g of groups) {
    map.set(g.providerId, {
      rating: Math.round((g._avg.rating ?? 0) * 10) / 10,
      reviewCount: g._count._all,
    });
  }
  return map;
}

const PUBLIC_PROVIDER_SELECT = {
  id: true,
  businessName: true,
  category: true,
  city: true,
  bio: true,
  latitude: true,
  longitude: true,
  photoUrls: true,
  createdAt: true,
} as const;

// Only approved providers whose account is switched on are ever shown to seekers.
// The owner's email and phone are never selected, so they cannot leak from here.
export async function listPublicProviders(params: {
  q?: string;
  category?: string;
  page: number;
  pageSize: number;
}) {
  const { q, category, page, pageSize } = params;

  const where = {
    ...providerStatusWhere("active"),
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" as const } },
            { category: { contains: q, mode: "insensitive" as const } },
            { city: { contains: q, mode: "insensitive" as const } },
            { bio: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.provider.findMany({
      where,
      select: PUBLIC_PROVIDER_SELECT,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.provider.count({ where }),
  ]);

  const ratings = await ratingsFor(rows.map((r) => r.id));
  const items = rows.map((r) => ({
    ...r,
    rating: ratings.get(r.id)?.rating ?? 0,
    reviewCount: ratings.get(r.id)?.reviewCount ?? 0,
  }));

  return { items, total, page, pageSize };
}

// Returns null when the provider does not exist or is not visible to seekers.
export async function getPublicProvider(providerId: string) {
  const provider = await prisma.provider.findFirst({
    where: { id: providerId, ...providerStatusWhere("active") },
    select: {
      ...PUBLIC_PROVIDER_SELECT,
      reviews: {
        orderBy: { createdAt: "desc" },
        take: PUBLIC_REVIEW_LIMIT,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          author: { select: { name: true } },
        },
      },
    },
  });
  if (!provider) return null;

  const ratings = await ratingsFor([provider.id]);
  const { reviews, ...rest } = provider;
  return {
    ...rest,
    rating: ratings.get(provider.id)?.rating ?? 0,
    reviewCount: ratings.get(provider.id)?.reviewCount ?? 0,
    reviews: reviews.map((r) => ({
      id: r.id,
      authorName: shortName(r.author.name),
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  };
}

export async function createJob(seekerId: string, input: CreateJobInput) {
  return prisma.job.create({
    data: {
      seekerId,
      category: input.category,
      description: input.description,
      city: input.city || null,
      budgetMinKES: input.budgetMinKES ?? null,
      budgetMaxKES: input.budgetMaxKES ?? null,
    },
    select: { id: true, category: true, description: true, city: true, status: true, createdAt: true },
  });
}

const JOB_ROW_SELECT = {
  id: true,
  category: true,
  description: true,
  city: true,
  status: true,
  createdAt: true,
  _count: { select: { bids: true } },
} as const;

function jobRow(job: {
  id: string;
  category: string;
  description: string;
  city: string | null;
  status: "open" | "awarded" | "completed" | "cancelled";
  createdAt: Date;
  _count: { bids: number };
}) {
  const { _count, ...rest } = job;
  return { ...rest, bidCount: _count.bids };
}

// A seeker only ever sees their own requests: the seeker id is part of the query itself.
export async function listSeekerJobs(seekerId: string) {
  const jobs = await prisma.job.findMany({
    where: { seekerId },
    select: JOB_ROW_SELECT,
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });
  return jobs.map(jobRow);
}

// Returns null when the request does not exist or belongs to someone else.
// Both cases look the same on purpose, so nobody can discover other people's requests.
export async function getSeekerJobBids(seekerId: string, jobId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, seekerId },
    select: {
      ...JOB_ROW_SELECT,
      bids: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          amountKES: true,
          message: true,
          status: true,
          createdAt: true,
          provider: { select: { id: true, businessName: true, city: true } },
        },
      },
    },
  });
  if (!job) return null;

  const ratings = await ratingsFor(job.bids.map((b) => b.provider.id));
  const { bids, ...jobOnly } = job;
  return {
    job: jobRow(jobOnly),
    bids: bids.map((b) => ({
      ...b,
      provider: {
        ...b.provider,
        rating: ratings.get(b.provider.id)?.rating ?? 0,
        reviewCount: ratings.get(b.provider.id)?.reviewCount ?? 0,
      },
    })),
  };
}

// Open requests in the provider's own category, plus any request they have already bid on,
// so they can see whether their bid was chosen. Returns null for someone who is not a provider.
export async function listProviderAlerts(userId: string) {
  const provider = await prisma.provider.findUnique({
    where: { userId },
    select: {
      id: true,
      category: true,
      verificationStatus: true,
      user: { select: { disabled: true } },
    },
  });
  if (!provider) return null;

  const jobs = await prisma.job.findMany({
    where: {
      seekerId: { not: userId },
      OR: [
        { status: "open", category: provider.category },
        { bids: { some: { providerId: provider.id } } },
      ],
    },
    select: {
      id: true,
      category: true,
      description: true,
      city: true,
      budgetMinKES: true,
      budgetMaxKES: true,
      status: true,
      createdAt: true,
      bids: {
        where: { providerId: provider.id },
        select: { id: true, amountKES: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
  });

  return {
    canBid: provider.verificationStatus === "verified" && !provider.user.disabled,
    items: jobs.map(({ bids, ...job }) => ({ ...job, myBid: bids[0] ?? null })),
  };
}

export async function placeBid(userId: string, jobId: string, input: PlaceBidInput) {
  const provider = await prisma.provider.findUnique({
    where: { userId },
    select: { id: true, category: true, verificationStatus: true, user: { select: { disabled: true } } },
  });
  if (!provider) throw new NotAProviderError();
  if (provider.verificationStatus !== "verified" || provider.user.disabled) {
    throw new ProviderNotApprovedError();
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, category: true, status: true, seekerId: true },
  });
  if (!job || job.seekerId === userId) throw new JobNotFoundError();
  if (job.status !== "open") throw new JobClosedError();
  if (job.category !== provider.category) throw new CategoryMismatchError();

  try {
    return await prisma.bid.create({
      data: {
        jobId: job.id,
        providerId: provider.id,
        amountKES: input.amountKES,
        message: input.message || null,
      },
      select: { id: true, amountKES: true, message: true, status: true, createdAt: true },
    });
  } catch (error) {
    // The database allows one bid per provider per request.
    if ((error as { code?: string }).code === "P2002") throw new AlreadyBidError();
    throw error;
  }
}

// Accepting a bid is one all-or-nothing step: the request closes, the chosen bid is
// accepted, the others are turned down, and an unpaid order is created.
// Returns null when the bid does not exist or is not on one of this seeker's requests.
export async function acceptBid(seekerId: string, bidId: string) {
  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    select: {
      id: true,
      jobId: true,
      amountKES: true,
      status: true,
      job: { select: { seekerId: true, status: true } },
      provider: { select: { userId: true } },
    },
  });
  if (!bid || bid.job.seekerId !== seekerId) return null;
  if (bid.status !== "pending" || bid.job.status !== "open") throw new BidNotAvailableError();

  const feeKES = Math.round(bid.amountKES * ESCROW_FEE_RATE);

  return prisma.$transaction(async (tx) => {
    // Only the first of two simultaneous accepts can close the request.
    const claimed = await tx.job.updateMany({
      where: { id: bid.jobId, status: "open" },
      data: { status: "awarded" },
    });
    if (claimed.count !== 1) throw new BidNotAvailableError();

    await tx.bid.update({ where: { id: bid.id }, data: { status: "accepted" } });
    await tx.bid.updateMany({
      where: { jobId: bid.jobId, id: { not: bid.id }, status: "pending" },
      data: { status: "rejected" },
    });

    return tx.transaction.create({
      data: {
        bidId: bid.id,
        seekerId,
        providerId: bid.provider.userId,
        amountKES: bid.amountKES,
        feeKES,
        status: "pending",
      },
      select: { id: true, amountKES: true, feeKES: true, status: true, createdAt: true },
    });
  });
}

// A person only ever sees orders where they are the buyer, or where they are the provider.
export async function listOrders(userId: string, role: "seeker" | "provider") {
  const rows = await prisma.transaction.findMany({
    where: role === "seeker" ? { seekerId: userId } : { providerId: userId },
    orderBy: { createdAt: "desc" },
    take: LIST_LIMIT,
    select: {
      id: true,
      amountKES: true,
      feeKES: true,
      status: true,
      createdAt: true,
      seekerId: true,
      seeker: { select: { name: true } },
      bid: {
        select: {
          provider: { select: { id: true, businessName: true } },
          job: { select: { description: true } },
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    amountKES: r.amountKES,
    feeKES: r.feeKES,
    status: r.status,
    createdAt: r.createdAt,
    service: r.bid.job.description,
    seekerId: r.seekerId,
    providerProfileId: r.bid.provider.id,
    counterpartyName: role === "seeker" ? r.bid.provider.businessName : shortName(r.seeker.name),
  }));
}
