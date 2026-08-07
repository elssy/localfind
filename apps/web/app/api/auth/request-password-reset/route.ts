import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { createPasswordResetToken } from "../../../../lib/auth/tokens";
import { sendPasswordResetEmail } from "../../../../lib/email";
import { passwordResetLimiter } from "../../../../lib/auth/rateLimit";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await passwordResetLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = await createPasswordResetToken(user.id);
    await sendPasswordResetEmail(user.email, token).catch(() => {});
  }

  // Always return the same response — don't reveal whether the email exists.
  return NextResponse.json({ ok: true });
}