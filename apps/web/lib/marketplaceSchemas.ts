import { z } from "zod";
import { CATEGORY_NAMES } from "./profileSchemas";

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);

const category = z
  .string()
  .refine((value) => CATEGORY_NAMES.includes(value), { message: "Choose a category from the list" });

export const listPublicProvidersSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: category.optional(),
  page,
  pageSize,
});

export const createJobSchema = z
  .object({
    category,
    description: z.string().trim().min(3, "Tell providers what you need").max(500),
    city: z.string().trim().max(100).optional(),
    budgetMinKES: z.number().int().min(0).max(10_000_000).optional(),
    budgetMaxKES: z.number().int().min(0).max(10_000_000).optional(),
  })
  .refine(
    (v) => v.budgetMinKES === undefined || v.budgetMaxKES === undefined || v.budgetMinKES <= v.budgetMaxKES,
    { message: "The lowest budget cannot be higher than the highest" }
  );

export const placeBidSchema = z.object({
  amountKES: z.number().int().min(1, "Enter an amount").max(10_000_000),
  message: z.string().trim().max(500).optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type PlaceBidInput = z.infer<typeof placeBidSchema>;
