import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/auth/requireUser";
import { searchLimiter, withinLimit } from "../../../lib/auth/rateLimit";
import { listPublicProviders } from "../../../lib/marketplace";
import { listPublicProvidersSchema } from "../../../lib/marketplaceSchemas";
import { queryToObject } from "../../../lib/adminSchemas";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  if (!(await withinLimit(searchLimiter, user.id, { failOpen: true }))) {
    return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  const parsed = listPublicProvidersSchema.safeParse(queryToObject(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search" }, { status: 400 });

  return NextResponse.json(await listPublicProviders(parsed.data));
}
