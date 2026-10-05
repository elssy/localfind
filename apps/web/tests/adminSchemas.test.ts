import { describe, it, expect } from "vitest";
import {
  listUsersSchema,
  listProvidersSchema,
  providerActionSchema,
  queryToObject,
} from "../lib/adminSchemas";

describe("queryToObject", () => {
  it("drops empty values so no filter and an empty filter behave the same", () => {
    const obj = queryToObject(new URLSearchParams("role=&q=amina&page=2"));
    expect(obj).toEqual({ q: "amina", page: "2" });
  });
});

describe("listUsersSchema", () => {
  it("applies sensible defaults", () => {
    expect(listUsersSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it("reads page numbers sent as text", () => {
    expect(listUsersSchema.parse({ page: "3", pageSize: "50" })).toMatchObject({ page: 3, pageSize: 50 });
  });

  it("only allows seeker or provider roles, never admin", () => {
    expect(listUsersSchema.safeParse({ role: "seeker" }).success).toBe(true);
    expect(listUsersSchema.safeParse({ role: "admin" }).success).toBe(false);
  });

  it("caps the page size and rejects nonsense", () => {
    expect(listUsersSchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(listUsersSchema.safeParse({ page: "0" }).success).toBe(false);
    expect(listUsersSchema.safeParse({ page: "abc" }).success).toBe(false);
  });

  it("trims the search text and limits its length", () => {
    expect(listUsersSchema.parse({ q: "  amina " }).q).toBe("amina");
    expect(listUsersSchema.safeParse({ q: "a".repeat(101) }).success).toBe(false);
  });
});

describe("listProvidersSchema", () => {
  it("accepts the four statuses and rejects others", () => {
    for (const status of ["active", "pending", "rejected", "suspended"]) {
      expect(listProvidersSchema.safeParse({ status }).success).toBe(true);
    }
    expect(listProvidersSchema.safeParse({ status: "deleted" }).success).toBe(false);
  });

  it("only accepts categories from the shared list", () => {
    expect(listProvidersSchema.safeParse({ category: "Auto Services" }).success).toBe(true);
    expect(listProvidersSchema.safeParse({ category: "Plumbing" }).success).toBe(false);
  });
});

describe("providerActionSchema", () => {
  it("accepts only the four known actions", () => {
    for (const action of ["approve", "reject", "suspend", "reinstate"]) {
      expect(providerActionSchema.safeParse({ action }).success).toBe(true);
    }
    expect(providerActionSchema.safeParse({ action: "delete" }).success).toBe(false);
    expect(providerActionSchema.safeParse({}).success).toBe(false);
  });
});
