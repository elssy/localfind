import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/db";
import { requireAdmin } from "../../../../../lib/auth/adminGuard";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === admin.id) {
    return NextResponse.json({ error: "You can't suspend your own account" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({ where: { id: params.id, role: "admin" } });
  if (!target) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { disabled: !target.disabled },
  });

  // If we just disabled them, kill any active sessions immediately.
  if (updated.disabled) {
    await prisma.session.deleteMany({ where: { userId: target.id } });
  }

  return NextResponse.json({ id: updated.id, disabled: updated.disabled });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (params.id === admin.id) {
    return NextResponse.json({ error: "You can't delete your own account" }, { status: 400 });
  }

  const target = await prisma.user.findFirst({ where: { id: params.id, role: "admin" } });
  if (!target) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

  await prisma.user.delete({ where: { id: target.id } });

  return NextResponse.json({ ok: true });
}