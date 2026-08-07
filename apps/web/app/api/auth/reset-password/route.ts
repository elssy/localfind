import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/auth/hash";
import { consumePasswordResetToken } from "../../../../lib/auth/tokens";

const schema = z.object({
  token: z.string(),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const userId = await consumePasswordResetToken(parsed.data.token);
  if (!userId) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

  // Also revoke all existing sessions for this user — a password reset
  // should kill any session an attacker might currently hold.
  await prisma.session.deleteMany({ where: { userId } });

  return NextResponse.json({ ok: true });
}