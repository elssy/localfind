import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/auth/hash";
import { createSession, setSessionCookie } from "../../../../lib/auth/session";
import { loginLimiter } from "../../../../lib/auth/rateLimit";
import { logAuthEvent } from "../../../../lib/auth/logger";
import { getProfileStatus } from "../../../../lib/profile";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const limitKey = `${ip}:${email}`;
  const { success } = await loginLimiter.limit(limitKey);
  if (!success) {
    await logAuthEvent({ event: "login", email, ipAddress: ip, success: false });
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const genericError = () =>
    NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user) {
    await logAuthEvent({ event: "login", email, ipAddress: ip, success: false });
    return genericError();
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await logAuthEvent({ event: "login", email, userId: user.id, ipAddress: ip, success: false });
    return genericError();
  }

  const sessionToken = await createSession(user.id, {
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  await setSessionCookie(sessionToken);
  await logAuthEvent({ event: "login", email, userId: user.id, ipAddress: ip, success: true });

  const { hasProfile } = await getProfileStatus(user.id, user.role);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      hasProfile,
    },
    token: sessionToken,
  });
}