import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth/adminGuard";
import { getAdminStats } from "../../../../lib/admin";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(await getAdminStats());
}
