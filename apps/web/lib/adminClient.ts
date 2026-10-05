// Small helpers used by the admin pages to call the admin API.

export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

export async function adminFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminApiError(data.error ?? "Request failed", res.status);
  return data as T;
}

export function describeError(error: unknown): string {
  if (error instanceof AdminApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Your session has ended or you no longer have access. Sign in again.";
    }
    return error.message;
  }
  return "Could not reach the server. Check your connection and try again.";
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export type ProviderStatus = "active" | "pending" | "rejected" | "suspended";
export type ProviderActionName = "approve" | "reject" | "suspend" | "reinstate";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "seeker" | "provider" | "admin";
  emailVerified: boolean;
  disabled: boolean;
  createdAt: string;
}

export interface ProviderRow {
  id: string;
  businessName: string;
  category: string;
  city: string | null;
  createdAt: string;
  status: ProviderStatus;
  owner: { name: string; email: string; phone: string };
}

export interface ProviderDetail {
  id: string;
  businessName: string;
  category: string;
  bio: string | null;
  city: string | null;
  createdAt: string;
  status: ProviderStatus;
  verificationStatus: "pending" | "verified" | "rejected";
  owner: {
    id: string;
    name: string;
    email: string;
    phone: string;
    emailVerified: boolean;
    disabled: boolean;
    createdAt: string;
  };
  tokenBalance: number;
  stats: { bidsSubmitted: number; jobsWon: number; feesGeneratedKES: number };
  tokenPurchases: {
    id: string;
    bundleName: string;
    tokensGranted: number;
    amountPaidKES: number;
    status: string;
    createdAt: string;
  }[];
  reviews: { id: string; authorName: string; rating: number; comment: string | null; createdAt: string }[];
  transactions: { id: string; amountKES: number; feeKES: number; status: string; createdAt: string }[];
}

export interface AdminStats {
  totalProviders: number;
  newProvidersLast30Days: number;
  totalSeekers: number;
  pendingVerifications: number;
  openDisputes: number;
  escrowVolumeKES: number;
  revenueKES: number;
  recentSignups: { id: string; name: string; role: "seeker" | "provider" | "admin"; createdAt: string }[];
}
