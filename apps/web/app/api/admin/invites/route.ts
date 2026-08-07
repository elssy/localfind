import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { requireAdmin } from "../../../../lib/auth/adminGuard";
import { generateRawToken, hashToken } from "../../../../lib/auth/hash";
import { sendAdminInviteEmail } from "../../../../lib/email";

const INVITE_EXPIRY_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const schema = z.object({ email: z.string().email() });

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [admins, invites] = await Promise.all([
    prisma.user.findMany({
      where: { role: "admin" },
      select: { id: true, name: true, email: true, createdAt: true, disabled: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.adminInvite.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return NextResponse.json({ admins, pendingInvites: invites });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const { email } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "That email already has an account" }, { status: 400 });
  }

  const rawToken = generateRawToken();
  await prisma.adminInvite.create({
    data: {
      tokenHash: hashToken(rawToken),
      email,
      invitedById: admin.id,
      expiresAt: new Date(Date.now() + INVITE_EXPIRY_MS),
    },
  });

  await sendAdminInviteEmail(email, rawToken).catch(() => {});

  return NextResponse.json({ ok: true });
}