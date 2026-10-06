import type { Provider, Transaction, TransactionStatus } from "./types";
import { NAIROBI_CENTER } from "./mockData";

// These describe what the server sends to the app for the marketplace screens.
// Dates arrive as text. Money is whole Kenyan shillings.

export interface PublicReviewRow {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

// A provider as a seeker may see them. It never includes the owner's email or phone.
export interface PublicProviderRow {
  id: string;
  businessName: string;
  category: string;
  city: string | null;
  bio: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrls: string[];
  createdAt: string;
  rating: number;
  reviewCount: number;
  reviews?: PublicReviewRow[];
}

export type JobStatusValue = "open" | "awarded" | "completed" | "cancelled";
export type BidStatusValue = "pending" | "accepted" | "rejected" | "withdrawn";

export interface JobRow {
  id: string;
  category: string;
  description: string;
  city: string | null;
  status: JobStatusValue;
  createdAt: string;
  bidCount: number;
}

export interface JobBidRow {
  id: string;
  amountKES: number;
  message: string | null;
  status: BidStatusValue;
  createdAt: string;
  provider: { id: string; businessName: string; city: string | null; rating: number; reviewCount: number };
}

export interface JobBidsResponse {
  job: JobRow;
  bids: JobBidRow[];
}

export interface AlertRow {
  id: string;
  category: string;
  description: string;
  city: string | null;
  budgetMinKES: number | null;
  budgetMaxKES: number | null;
  createdAt: string;
  status: JobStatusValue;
  myBid: { id: string; amountKES: number; status: BidStatusValue } | null;
}

export interface AlertsResponse {
  // False until an admin approves the business. Providers can look but not bid.
  canBid: boolean;
  items: AlertRow[];
}

export interface OrderRow {
  id: string;
  amountKES: number;
  feeKES: number;
  status: TransactionStatus;
  createdAt: string;
  service: string;
  seekerId: string;
  providerProfileId: string;
  counterpartyName: string;
}

// "Wanjiru Kamau" becomes "Wanjiru K." so reviews and orders never show a full name.
export function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function providerFromPublic(row: PublicProviderRow): Provider {
  const located = row.latitude !== null && row.longitude !== null;
  return {
    id: row.id,
    name: row.businessName,
    category: row.category,
    subcategory: "",
    rating: row.rating,
    reviewCount: row.reviewCount,
    lat: row.latitude ?? NAIROBI_CENTER.lat,
    lng: row.longitude ?? NAIROBI_CENTER.lng,
    address: row.city ?? "",
    tokenBalance: 0,
    bio: row.bio ?? "",
    photos: row.photoUrls,
    verified: true,
    responseTime: "",
    services: [],
    status: "active",
    joinedAt: row.createdAt,
    located,
  };
}

export function transactionFromOrder(order: OrderRow): Transaction {
  return {
    id: order.id,
    seekerId: order.seekerId,
    providerId: order.providerProfileId,
    amount: order.amountKES,
    fee: order.feeKES,
    status: order.status,
    service: order.service,
    createdAt: order.createdAt,
    counterpartyName: order.counterpartyName,
  };
}
