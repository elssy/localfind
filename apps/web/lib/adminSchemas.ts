import { z } from "zod";
import { PROVIDER_ACTIONS, PROVIDER_STATUS_FILTERS } from "./adminStatus";
import { CATEGORY_NAMES } from "./profileSchemas";

const page = z.coerce.number().int().min(1).default(1);
const pageSize = z.coerce.number().int().min(1).max(100).default(20);
const search = z.string().trim().max(100).optional();

export const listUsersSchema = z.object({
  role: z.enum(["seeker", "provider"]).optional(),
  q: search,
  page,
  pageSize,
});

export const listProvidersSchema = z.object({
  status: z.enum(PROVIDER_STATUS_FILTERS).optional(),
  category: z
    .string()
    .refine((value) => CATEGORY_NAMES.includes(value), { message: "Unknown category" })
    .optional(),
  q: search,
  page,
  pageSize,
});

export const providerActionSchema = z.object({
  action: z.enum(PROVIDER_ACTIONS),
});

// Turns ?a=1&b= into { a: "1" }. Empty values are dropped so "no filter" and
// "empty filter" mean the same thing.
export function queryToObject(searchParams: URLSearchParams): Record<string, string> {
  const result: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    if (value !== "") result[key] = value;
  });
  return result;
}
