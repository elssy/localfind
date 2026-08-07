import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/auth/hash";
import { createSession, setSessionCookie } from "../../../../lib/auth/session";
import { createEmailVerificationToken } from "../../../../lib/auth/tokens";
import { sendVerificationEmail } from "../../../../lib/email";
import { registerLimiter } from "../../../../lib/auth/rateLimit";
import { logAuthEvent } from "../../../../lib/auth/logger";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().min(9).max(20),
  password: z.string().min(8).max(200),
  role: z.enum(["seeker", "provider"]).default("seeker"),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const { success } = await registerLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { name, email, phone, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Same generic message either way — don't reveal which emails are registered.
    return NextResponse.json({ error: "Unable to create account" }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role },
  });

  const verifyToken = await createEmailVerificationToken(user.id);
  await sendVerificationEmail(email, verifyToken).catch(() => {});

  const sessionToken = await createSession(user.id, {
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  await setSessionCookie(sessionToken);

  await logAuthEvent({ event: "register", email, userId: user.id, ipAddress: ip, success: true });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
    token: sessionToken, // mobile stores this; web already has the cookie set
  });
}