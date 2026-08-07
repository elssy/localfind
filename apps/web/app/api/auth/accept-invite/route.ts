import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { hashPassword, hashToken } from "../../../../lib/auth/hash";
import { createSession, setSessionCookie } from "../../../../lib/auth/session";

const schema = z.object({
  token: z.string(),
  name: z.string().min(1),
  phone: z.string().min(9),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const tokenHash = hashToken(parsed.data.token);
  const invite = await prisma.adminInvite.findUnique({ where: { tokenHash } });

  if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invalid or expired invite link" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  if (existing) {
    return NextResponse.json({ error: "An account already exists for this email" }, { status: 400 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  const admin = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: invite.email,
        phone: parsed.data.phone,
        passwordHash,
        role: "admin",
        emailVerified: true, // trusted via the invite link itself
      },
    });
    await tx.adminInvite.update({ where: { id: invite.id }, data: { usedAt: new Date() } });
    return user;
  });

  const sessionToken = await createSession(admin.id, {
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  await setSessionCookie(sessionToken);

  return NextResponse.json({
    user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
  });
}