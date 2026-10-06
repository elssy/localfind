import { describe, it, expect } from "vitest";
import {
  shortName,
  providerFromPublic,
  transactionFromOrder,
  NAIROBI_CENTER,
} from "@localfind/shared";
import type { PublicProviderRow, OrderRow } from "@localfind/shared";

describe("shortName", () => {
  it("keeps the first name and only the first letter of the last", () => {
    expect(shortName("Wanjiru Kamau")).toBe("Wanjiru K.");
    expect(shortName("  Amina   Wanjiru   Otieno ")).toBe("Amina O.");
  });

  it("copes with one name or none", () => {
    expect(shortName("Amina")).toBe("Amina");
    expect(shortName("   ")).toBe("Customer");
  });
});

const row: PublicProviderRow = {
  id: "prov1",
  businessName: "Wanjiru Salon",
  category: "Beauty & Wellness",
  city: "Westlands",
  bio: "Braids and nails",
  latitude: -1.26,
  longitude: 36.8,
  photoUrls: [],
  createdAt: "2026-10-01T10:00:00.000Z",
  rating: 4.5,
  reviewCount: 2,
};

describe("providerFromPublic", () => {
  it("uses the real details and the real rating", () => {
    const p = providerFromPublic(row);
    expect(p).toMatchObject({
      id: "prov1",
      name: "Wanjiru Salon",
      category: "Beauty & Wellness",
      address: "Westlands",
      bio: "Braids and nails",
      rating: 4.5,
      reviewCount: 2,
      verified: true,
      status: "active",
      located: true,
    });
  });

  it("marks a provider with no map location so the map can leave them out", () => {
    const p = providerFromPublic({ ...row, latitude: null, longitude: null, city: null, bio: null });
    expect(p.located).toBe(false);
    expect(p.lat).toBe(NAIROBI_CENTER.lat);
    expect(p.address).toBe("");
    expect(p.bio).toBe("");
  });
});

describe("transactionFromOrder", () => {
  it("maps an order to the shape the order screens use", () => {
    const order: OrderRow = {
      id: "t1",
      amountKES: 2000,
      feeKES: 100,
      status: "pending",
      createdAt: "2026-10-02T10:00:00.000Z",
      service: "Gel nails",
      seekerId: "user9",
      providerProfileId: "prov1",
      counterpartyName: "Wanjiru Salon",
    };
    expect(transactionFromOrder(order)).toEqual({
      id: "t1",
      seekerId: "user9",
      providerId: "prov1",
      amount: 2000,
      fee: 100,
      status: "pending",
      service: "Gel nails",
      createdAt: "2026-10-02T10:00:00.000Z",
      counterpartyName: "Wanjiru Salon",
    });
  });
});
