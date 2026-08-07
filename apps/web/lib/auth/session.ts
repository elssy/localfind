import { cookies } from "next/headers";
import { prisma } from "../db";
import { generateRawToken, hashToken } from "./hash";

const SESSION_COOKIE = "session_token";
const SESSION_DURATION_DAYS = 30;

export async function createSession(userId: string, req: { ip?: string; userAgent?: string }) {
  const rawToken = generateRawToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
      ipAddress: req.ip,
      userAgent: req.userAgent,
    },
  });

  return rawToken;
}

export async function setSessionCookie(rawToken: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

// Works for both web (cookie) and mobile (Bearer header) callers.
export async function getSessionUser(bearerToken?: string) {
  let rawToken = bearerToken;
  if (!rawToken) {
    const store = await cookies();
    rawToken = store.get(SESSION_COOKIE)?.value;
  }
  if (!rawToken) return null;

  const tokenHash = hashToken(rawToken);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) return null;
  if (session.user.disabled) return null; // suspended admins lose access immediately

  return session.user;
}

export async function revokeSession(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.session.deleteMany({ where: { tokenHash } });
}