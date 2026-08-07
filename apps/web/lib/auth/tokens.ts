import { prisma } from "../db";
import { generateRawToken, hashToken } from "./hash";

const VERIFY_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const RESET_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export async function createEmailVerificationToken(userId: string) {
  const raw = generateRawToken();
  await prisma.emailVerificationToken.create({
    data: {
      tokenHash: hashToken(raw),
      userId,
      expiresAt: new Date(Date.now() + VERIFY_EXPIRY_MS),
    },
  });
  return raw;
}

export async function consumeEmailVerificationToken(raw: string) {
  const tokenHash = hashToken(raw);
  const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;

  await prisma.$transaction([
    prisma.emailVerificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: true } }),
  ]);

  return record.userId;
}

export async function createPasswordResetToken(userId: string) {
  const raw = generateRawToken();
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(raw),
      userId,
      expiresAt: new Date(Date.now() + RESET_EXPIRY_MS),
    },
  });
  return raw;
}

export async function consumePasswordResetToken(raw: string) {
  const tokenHash = hashToken(raw);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) return null;

  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}