import type { Provider, ProviderStatus, Seeker } from "./types";
import { NAIROBI_CENTER } from "./mockData";

export type VerificationStatusValue = "pending" | "verified" | "rejected";

// The shape of a provider profile row as the API sends it (dates arrive as text).
export interface ProviderProfileRow {
  id: string;
  businessName: string;
  category: string;
  bio: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  photoUrls: string[];
  verificationStatus: VerificationStatusValue;
  createdAt: string;
}

export interface SessionUserRow {
  id: string;
  name: string;
  phone: string;
}

const STATUS_MAP: Record<VerificationStatusValue, ProviderStatus> = {
  verified: "active",
  pending: "pending",
  rejected: "suspended",
};

// Turns the signed-in provider's real database profile into the object the
// mobile screens already know how to display. Fields that do not exist in the
// database yet (rating, reviews, tokens, services) start empty, never faked.
export function providerFromProfile(row: ProviderProfileRow): Provider {
  return {
    id: row.id,
    name: row.businessName,
    category: row.category,
    subcategory: "",
    rating: 0,
    reviewCount: 0,
    lat: row.latitude ?? NAIROBI_CENTER.lat,
    lng: row.longitude ?? NAIROBI_CENTER.lng,
    address: row.city ?? "",
    tokenBalance: 0,
    bio: row.bio ?? "",
    photos: row.photoUrls,
    verified: row.verificationStatus === "verified",
    responseTime: "New provider",
    services: [],
    status: STATUS_MAP[row.verificationStatus],
    joinedAt: row.createdAt,
    located: row.latitude !== null && row.longitude !== null,
  };
}

export function seekerFromUser(user: SessionUserRow): Seeker {
  return { id: user.id, name: user.name, phone: user.phone, avatar: null };
}
