import { describe, it, expect } from "vitest";
import { providerDisplayStatus, providerStatusWhere } from "../lib/adminStatus";

describe("providerDisplayStatus", () => {
  it("shows suspended whenever the account is switched off, whatever the review says", () => {
    expect(providerDisplayStatus("verified", true)).toBe("suspended");
    expect(providerDisplayStatus("pending", true)).toBe("suspended");
    expect(providerDisplayStatus("rejected", true)).toBe("suspended");
  });

  it("follows the verification review when the account is on", () => {
    expect(providerDisplayStatus("verified", false)).toBe("active");
    expect(providerDisplayStatus("pending", false)).toBe("pending");
    expect(providerDisplayStatus("rejected", false)).toBe("rejected");
  });
});

describe("providerStatusWhere", () => {
  it("filters suspended providers by the account switch only", () => {
    expect(providerStatusWhere("suspended")).toEqual({ user: { disabled: true } });
  });

  it("excludes suspended accounts from every other status", () => {
    for (const status of ["active", "pending", "rejected"] as const) {
      expect(providerStatusWhere(status).user).toEqual({ disabled: false });
    }
  });

  it("maps each status to the matching verification value", () => {
    expect(providerStatusWhere("active")).toMatchObject({ verificationStatus: "verified" });
    expect(providerStatusWhere("pending")).toMatchObject({ verificationStatus: "pending" });
    expect(providerStatusWhere("rejected")).toMatchObject({ verificationStatus: "rejected" });
  });
});
