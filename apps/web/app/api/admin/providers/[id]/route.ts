import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../../lib/auth/adminGuard";
import { logAuthEvent } from "../../../../../lib/auth/logger";
import { applyProviderAction, getProviderDetail } from "../../../../../lib/admin";
import { providerActionSchema } from "../../../../../lib/adminSchemas";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const detail = await getProviderDetail(params.id);
  if (!detail) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  return NextResponse.json(detail);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = providerActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const result = await applyProviderAction(params.id, parsed.data.action);
  if (!result) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  // A permanent record of who changed what, for later review.
  await logAuthEvent({
    event: `admin_provider_${parsed.data.action}`,
    email: result.ownerEmail,
    userId: admin.id,
    ipAddress: req.headers.get("x-forwarded-for") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
    success: true,
  });

  return NextResponse.json({
    id: result.id,
    verificationStatus: result.verificationStatus,
    status: result.status,
  });
}
