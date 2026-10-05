import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/adminGuard";
import { listProviders } from "../../../../lib/admin";
import { listProvidersSchema, queryToObject } from "../../../../lib/adminSchemas";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = listProvidersSchema.safeParse(queryToObject(req.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid filters" }, { status: 400 });

  return NextResponse.json(await listProviders(parsed.data));
}
