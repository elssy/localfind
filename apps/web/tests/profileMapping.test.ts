import { describe, it, expect } from "vitest";
import { providerFromProfile, seekerFromUser, NAIROBI_CENTER } from "@localfind/shared";
import type { ProviderProfileRow } from "@localfind/shared";

const row: ProviderProfileRow = {
  id: "prov_123",
  businessName: "Wanjiru Salon",
  category: "Beauty & Wellness",
  bio: "Braids and nails",
  city: "Westlands",
  latitude: -1.26,
  longitude: 36.8,
  photoUrls: ["a.jpg"],
  verificationStatus: "pending",
  createdAt: "2026-10-01T10:00:00.000Z",
};

describe("providerFromProfile", () => {
  it("uses the real business details, not demo data", () => {
    const p = providerFromProfile(row);
    expect(p.id).toBe("prov_123");
    expect(p.name).toBe("Wanjiru Salon");
    expect(p.category).toBe("Beauty & Wellness");
    expect(p.bio).toBe("Braids and nails");
    expect(p.address).toBe("Westlands");
    expect(p.lat).toBe(-1.26);
    expect(p.joinedAt).toBe("2026-10-01T10:00:00.000Z");
  });

  it("starts fields the database does not track yet at empty values", () => {
    const p = providerFromProfile(row);
    expect(p.rating).toBe(0);
    expect(p.reviewCount).toBe(0);
    expect(p.tokenBalance).toBe(0);
    expect(p.services).toEqual([]);
  });

  it("falls back to safe defaults for missing optional fields", () => {
    const p = providerFromProfile({ ...row, bio: null, city: null, latitude: null, longitude: null });
    expect(p.bio).toBe("");
    expect(p.address).toBe("");
    expect(p.lat).toBe(NAIROBI_CENTER.lat);
    expect(p.lng).toBe(NAIROBI_CENTER.lng);
  });

  it("maps verification status to the status the screens use", () => {
    expect(providerFromProfile({ ...row, verificationStatus: "verified" })).toMatchObject({ status: "active", verified: true });
    expect(providerFromProfile({ ...row, verificationStatus: "pending" })).toMatchObject({ status: "pending", verified: false });
    expect(providerFromProfile({ ...row, verificationStatus: "rejected" })).toMatchObject({ status: "suspended", verified: false });
  });
});

describe("seekerFromUser", () => {
  it("uses the signed-in user's own details", () => {
    expect(seekerFromUser({ id: "u1", name: "Amina", phone: "+254700000001" })).toEqual({
      id: "u1",
      name: "Amina",
      phone: "+254700000001",
      avatar: null,
    });
  });
});
