export type VerificationStatusValue = "pending" | "verified" | "rejected";

// What the admin sees for a provider. "suspended" means the owner's account is
// switched off. Otherwise it reflects the verification review.
export type ProviderDisplayStatus = "active" | "pending" | "rejected" | "suspended";

export const PROVIDER_STATUS_FILTERS = ["active", "pending", "rejected", "suspended"] as const;
export const PROVIDER_ACTIONS = ["approve", "reject", "suspend", "reinstate"] as const;
export type ProviderAction = (typeof PROVIDER_ACTIONS)[number];

export function providerDisplayStatus(
  verification: VerificationStatusValue,
  accountDisabled: boolean
): ProviderDisplayStatus {
  if (accountDisabled) return "suspended";
  if (verification === "verified") return "active";
  if (verification === "rejected") return "rejected";
  return "pending";
}

// The same rules as above, expressed as a database filter, so the list can be
// filtered by status in the database instead of in the browser.
export function providerStatusWhere(status: ProviderDisplayStatus) {
  switch (status) {
    case "suspended":
      return { user: { disabled: true } };
    case "active":
      return { verificationStatus: "verified" as const, user: { disabled: false } };
    case "rejected":
      return { verificationStatus: "rejected" as const, user: { disabled: false } };
    case "pending":
      return { verificationStatus: "pending" as const, user: { disabled: false } };
  }
}
