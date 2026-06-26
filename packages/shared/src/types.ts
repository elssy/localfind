export type TransactionStatus = "in_escrow" | "released" | "disputed";
export type DisputeStatus = "open" | "under_review" | "resolved";
export type ProviderStatus = "active" | "pending" | "suspended";

export interface Seeker {
  id: string;
  name: string;
  phone: string;
  avatar: string | null;
}

export interface Service {
  name: string;
  price: number;
}

export interface Provider {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  rating: number;
  reviewCount: number;
  lat: number;
  lng: number;
  address: string;
  tokenBalance: number;
  bio: string;
  photos: string[];
  verified: boolean;
  responseTime: string;
  services: Service[];
  status: ProviderStatus;
  joinedAt: string;
}

export interface Bid {
  id: string;
  providerId: string;
  requestId: string;
  amount: number;
  note: string;
  eta: string;
  submittedAt: string;
}

export interface Transaction {
  id: string;
  seekerId: string;
  providerId: string;
  amount: number;
  fee: number;
  status: TransactionStatus;
  service: string;
  createdAt: string;
}

export interface TokenBundle {
  id: string;
  name: string;
  alerts: number;
  price: number;
  pricePerAlert: number;
  tag?: string;
}

export interface TokenPurchase {
  id: string;
  providerId: string;
  bundleId: string;
  tokens: number;
  amountPaid: number;
  date: string;
}

export interface Review {
  id: string;
  providerId: string;
  authorName: string;
  rating: number;
  text: string;
  date: string;
}

export interface SearchAlert {
  id: string;
  providerId: string;
  query: string;
  category: string;
  location: string;
  distanceKm: number;
  createdAt: string;
  budgetMin?: number;
  budgetMax?: number;
  status: "new" | "bid_sent" | "ignored";
}

export interface Dispute {
  id: string;
  transactionId: string;
  seekerId: string;
  providerId: string;
  amount: number;
  reason: string;
  status: DisputeStatus;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  type:
    | "provider_registered"
    | "bid_accepted"
    | "payment_released"
    | "token_purchase"
    | "dispute_raised";
  description: string;
  timestamp: string;
  status: string;
}

export interface Category {
  name: string;
  icon: string;
  active: boolean;
}
