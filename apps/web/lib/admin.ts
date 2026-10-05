import type { Role } from "@prisma/client";
import { prisma } from "./db";
import {
  providerDisplayStatus,
  providerStatusWhere,
  type ProviderAction,
  type ProviderDisplayStatus,
} from "./adminStatus";

const MARKETPLACE_ROLES: Role[] = ["seeker", "provider"];
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function pageWindow(page: number, pageSize: number) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

// Fields are listed one by one on purpose. The password hash can never be
// returned from here, even by accident.
const USER_LIST_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  emailVerified: true,
  disabled: true,
  createdAt: true,
} as const;

export async function listUsers(params: {
  role?: "seeker" | "provider";
  q?: string;
  page: number;
  pageSize: number;
}) {
  const { role, q, page, pageSize } = params;

  // Admins are managed on their own page, so this list is only seekers and providers.
  const where = {
    role: role ?? { in: MARKETPLACE_ROLES },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: USER_LIST_SELECT,
      orderBy: { createdAt: "desc" },
      ...pageWindow(page, pageSize),
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function listProviders(params: {
  status?: ProviderDisplayStatus;
  category?: string;
  q?: string;
  page: number;
  pageSize: number;
}) {
  const { status, category, q, page, pageSize } = params;

  const where = {
    ...(status ? providerStatusWhere(status) : {}),
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { businessName: { contains: q, mode: "insensitive" as const } },
            { user: { name: { contains: q, mode: "insensitive" as const } } },
            { user: { email: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.provider.findMany({
      where,
      select: {
        id: true,
        businessName: true,
        category: true,
        city: true,
        verificationStatus: true,
        createdAt: true,
        user: { select: { name: true, email: true, phone: true, disabled: true } },
      },
      orderBy: { createdAt: "desc" },
      ...pageWindow(page, pageSize),
    }),
    prisma.provider.count({ where }),
  ]);

  const items = rows.map((row) => ({
    id: row.id,
    businessName: row.businessName,
    category: row.category,
    city: row.city,
    createdAt: row.createdAt,
    verificationStatus: row.verificationStatus,
    status: providerDisplayStatus(row.verificationStatus, row.user.disabled),
    owner: { name: row.user.name, email: row.user.email, phone: row.user.phone },
  }));

  return { items, total, page, pageSize };
}

// Returns null when the provider does not exist.
export async function applyProviderAction(providerId: string, action: ProviderAction) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    select: { id: true, userId: true, user: { select: { email: true } } },
  });
  if (!provider) return null;

  switch (action) {
    case "approve":
      await prisma.provider.update({
        where: { id: provider.id },
        data: { verificationStatus: "verified" },
      });
      break;
    case "reject":
      await prisma.provider.update({
        where: { id: provider.id },
        data: { verificationStatus: "rejected" },
      });
      break;
    case "suspend":
      // Switching the account off also ends every open session, so the person
      // is signed out of the app straight away and not at their next login.
      await prisma.$transaction([
        prisma.user.update({ where: { id: provider.userId }, data: { disabled: true } }),
        prisma.session.deleteMany({ where: { userId: provider.userId } }),
      ]);
      break;
    case "reinstate":
      await prisma.user.update({ where: { id: provider.userId }, data: { disabled: false } });
      break;
  }

  const updated = await prisma.provider.findUniqueOrThrow({
    where: { id: provider.id },
    select: { id: true, verificationStatus: true, user: { select: { disabled: true } } },
  });

  return {
    id: updated.id,
    verificationStatus: updated.verificationStatus,
    status: providerDisplayStatus(updated.verificationStatus, updated.user.disabled),
    ownerEmail: provider.user.email,
  };
}

// Returns null when the provider does not exist.
export async function getProviderDetail(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          emailVerified: true,
          disabled: true,
          createdAt: true,
        },
      },
      tokenBalance: true,
      tokenPurchases: { orderBy: { createdAt: "desc" }, take: 20 },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { author: { select: { name: true } } },
      },
      _count: { select: { bids: true } },
    },
  });
  if (!provider) return null;

  // Transactions point at the provider's user account, not the provider row.
  const [transactions, transactionTotals] = await Promise.all([
    prisma.transaction.findMany({
      where: { providerId: provider.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, amountKES: true, feeKES: true, status: true, createdAt: true },
    }),
    prisma.transaction.aggregate({
      where: { providerId: provider.userId },
      _count: true,
      _sum: { feeKES: true },
    }),
  ]);

  return {
    id: provider.id,
    businessName: provider.businessName,
    category: provider.category,
    bio: provider.bio,
    city: provider.city,
    createdAt: provider.createdAt,
    verificationStatus: provider.verificationStatus,
    status: providerDisplayStatus(provider.verificationStatus, provider.user.disabled),
    owner: provider.user,
    tokenBalance: provider.tokenBalance?.balance ?? 0,
    stats: {
      bidsSubmitted: provider._count.bids,
      jobsWon: transactionTotals._count,
      feesGeneratedKES: transactionTotals._sum.feeKES ?? 0,
    },
    tokenPurchases: provider.tokenPurchases,
    reviews: provider.reviews.map((r) => ({
      id: r.id,
      authorName: r.author.name,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    transactions,
  };
}

export async function getAdminStats() {
  const since = new Date(Date.now() - THIRTY_DAYS_MS);

  const [
    totalProviders,
    newProviders,
    totalSeekers,
    pendingVerifications,
    openDisputes,
    escrow,
    earnedFees,
    tokenRevenue,
    recentSignups,
  ] = await Promise.all([
    prisma.provider.count(),
    prisma.provider.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count({ where: { role: "seeker" } }),
    prisma.provider.count({ where: providerStatusWhere("pending") }),
    prisma.dispute.count({ where: { status: "open" } }),
    prisma.transaction.aggregate({
      where: { status: { in: ["in_escrow", "released"] } },
      _sum: { amountKES: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "released" },
      _sum: { feeKES: true },
    }),
    prisma.tokenPurchase.aggregate({
      where: { status: "completed" },
      _sum: { amountPaidKES: true },
    }),
    prisma.user.findMany({
      where: { role: { in: MARKETPLACE_ROLES } },
      select: { id: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const feesKES = earnedFees._sum.feeKES ?? 0;
  const tokensKES = tokenRevenue._sum.amountPaidKES ?? 0;

  return {
    totalProviders,
    newProvidersLast30Days: newProviders,
    totalSeekers,
    pendingVerifications,
    openDisputes,
    escrowVolumeKES: escrow._sum.amountKES ?? 0,
    // Revenue is the fee on completed jobs plus completed token purchases.
    revenueKES: feesKES + tokensKES,
    recentSignups,
  };
}
