import { describe, it, expect } from "vitest";
import { createJobSchema, placeBidSchema, listPublicProvidersSchema } from "../lib/marketplaceSchemas";

describe("createJobSchema", () => {
  const valid = { category: "Beauty & Wellness", description: "Gel nails for Saturday" };

  it("accepts a normal request", () => {
    expect(createJobSchema.safeParse(valid).success).toBe(true);
  });

  it("only accepts categories from the shared list", () => {
    expect(createJobSchema.safeParse({ ...valid, category: "Plumbing" }).success).toBe(false);
  });

  it("needs a real description, trimmed and not too long", () => {
    expect(createJobSchema.safeParse({ ...valid, description: "hi" }).success).toBe(false);
    expect(createJobSchema.safeParse({ ...valid, description: "a".repeat(501) }).success).toBe(false);
    expect(createJobSchema.parse({ ...valid, description: "  Gel nails  " }).description).toBe("Gel nails");
  });

  it("does not let the lowest budget exceed the highest", () => {
    expect(createJobSchema.safeParse({ ...valid, budgetMinKES: 2000, budgetMaxKES: 1000 }).success).toBe(false);
    expect(createJobSchema.safeParse({ ...valid, budgetMinKES: 1000, budgetMaxKES: 2000 }).success).toBe(true);
  });

  it("rejects negative or fractional budgets", () => {
    expect(createJobSchema.safeParse({ ...valid, budgetMinKES: -1 }).success).toBe(false);
    expect(createJobSchema.safeParse({ ...valid, budgetMaxKES: 10.5 }).success).toBe(false);
  });
});

describe("placeBidSchema", () => {
  it("accepts a whole number amount", () => {
    expect(placeBidSchema.safeParse({ amountKES: 1500 }).success).toBe(true);
  });

  it("rejects zero, negative, fractional, huge and non-number amounts", () => {
    for (const amountKES of [0, -5, 10.5, 10_000_001, "1500", null]) {
      expect(placeBidSchema.safeParse({ amountKES }).success, String(amountKES)).toBe(false);
    }
  });

  it("limits the length of the note", () => {
    expect(placeBidSchema.safeParse({ amountKES: 100, message: "a".repeat(501) }).success).toBe(false);
  });
});

describe("listPublicProvidersSchema", () => {
  it("applies defaults and caps the page size", () => {
    expect(listPublicProvidersSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(listPublicProvidersSchema.safeParse({ pageSize: "101" }).success).toBe(false);
  });

  it("only accepts known categories", () => {
    expect(listPublicProvidersSchema.safeParse({ category: "Auto Services" }).success).toBe(true);
    expect(listPublicProvidersSchema.safeParse({ category: "Nope" }).success).toBe(false);
  });
});
