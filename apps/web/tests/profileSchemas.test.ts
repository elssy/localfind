import { describe, it, expect } from "vitest";
import { CATEGORIES } from "@localfind/shared";
import { providerProfileSchema, seekerProfileSchema } from "../lib/profileSchemas";

const valid = { businessName: "Kariuki Auto Garage", category: "Auto Services" };

describe("providerProfileSchema category", () => {
  it("accepts every category the app offers", () => {
    for (const c of CATEGORIES) {
      const result = providerProfileSchema.safeParse({ ...valid, category: c.name });
      expect(result.success, `category ${c.name} should be accepted`).toBe(true);
    }
  });

  it("rejects a category that is not in the list", () => {
    expect(providerProfileSchema.safeParse({ ...valid, category: "Plumbing" }).success).toBe(false);
  });

  it("rejects text that only looks like a category", () => {
    expect(providerProfileSchema.safeParse({ ...valid, category: "auto services" }).success).toBe(false);
    expect(providerProfileSchema.safeParse({ ...valid, category: " Auto Services" }).success).toBe(false);
  });

  it("rejects an empty or missing category", () => {
    expect(providerProfileSchema.safeParse({ ...valid, category: "" }).success).toBe(false);
    expect(providerProfileSchema.safeParse({ businessName: "Kariuki Auto Garage" }).success).toBe(false);
  });
});

describe("providerProfileSchema other fields", () => {
  it("trims the business name", () => {
    const result = providerProfileSchema.parse({ ...valid, businessName: "  Kariuki Auto Garage  " });
    expect(result.businessName).toBe("Kariuki Auto Garage");
  });

  it("rejects a one character business name", () => {
    expect(providerProfileSchema.safeParse({ ...valid, businessName: "K" }).success).toBe(false);
  });

  it("rejects a bio longer than 1000 characters", () => {
    expect(providerProfileSchema.safeParse({ ...valid, bio: "a".repeat(1001) }).success).toBe(false);
  });
});

describe("providerProfileSchema partial updates", () => {
  const partial = providerProfileSchema.partial();

  it("accepts a change to the city only", () => {
    expect(partial.safeParse({ city: "Mombasa" }).success).toBe(true);
  });

  it("still rejects an invalid category inside a partial update", () => {
    expect(partial.safeParse({ category: "Plumbing" }).success).toBe(false);
  });

  it("accepts a valid category change", () => {
    expect(partial.safeParse({ category: "Home Services" }).success).toBe(true);
  });
});

describe("seekerProfileSchema", () => {
  it("accepts a city and trims it", () => {
    expect(seekerProfileSchema.parse({ city: " Nairobi " }).city).toBe("Nairobi");
  });

  it("accepts an empty profile", () => {
    expect(seekerProfileSchema.safeParse({}).success).toBe(true);
  });
});
