import { z } from "zod";
import { CATEGORIES } from "@localfind/shared";

// One list of categories drives the seeker search tiles, the provider dropdown
// and this server check, so the three can never drift apart.
export const CATEGORY_NAMES: readonly string[] = CATEGORIES.map((c) => c.name);

export const providerProfileSchema = z.object({
  businessName: z.string().trim().min(2).max(100),
  category: z
    .string()
    .refine((value) => CATEGORY_NAMES.includes(value), {
      message: "Choose a category from the list",
    }),
  bio: z.string().trim().max(1000).optional(),
  city: z.string().trim().max(100).optional(),
});

export const seekerProfileSchema = z.object({
  city: z.string().trim().max(100).optional(),
});

export type ProviderProfileInput = z.infer<typeof providerProfileSchema>;
export type SeekerProfileInput = z.infer<typeof seekerProfileSchema>;
