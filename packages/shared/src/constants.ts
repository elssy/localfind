export const ESCROW_FEE_RATE = 0.05;
export const ALERT_COST_PER_TOKEN_KES = 10;

export const COLORS = {
  primaryBlue: "#1A5CA8",
  lightBlueTint: "#EAF2FB",
  darkText: "#1A1A1A",
  midText: "#444444",
  mutedText: "#777777",
  border: "#DDDDDD",
  background: "#F7F9FC",
  white: "#FFFFFF",
  successGreen: "#1D9E75",
  warningAmber: "#BA7517",
  dangerRed: "#E24B4A",
  escrowPurple: "#7F77DD",
} as const;

export const CATEGORIES = [
  { name: "Beauty & Wellness", icon: "cut-outline" },
  { name: "Home Services", icon: "home-outline" },
  { name: "Auto Services", icon: "car-outline" },
  { name: "Food & Catering", icon: "restaurant-outline" },
  { name: "Legal & Professional", icon: "briefcase-outline" },
  { name: "General Retail", icon: "bag-outline" },
] as const;

export const CATEGORY_PIN_COLORS: Record<string, string> = {
  "Beauty & Wellness": COLORS.primaryBlue,
  "Home Services": COLORS.primaryBlue,
  "Legal & Professional": COLORS.primaryBlue,
  "Food & Catering": COLORS.successGreen,
  "Auto Services": COLORS.warningAmber,
  "General Retail": COLORS.primaryBlue,
};

export function formatKES(amount: number): string {
  return `KES ${amount.toLocaleString("en-KE")}`;
}

export function formatKm(km: number): string {
  return `${km.toFixed(1)} km`;
}
