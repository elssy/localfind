import { prisma } from "../db";

export async function logAuthEvent(params: {
  event: string;
  email?: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}) {
  await prisma.authLog.create({ data: params }).catch(() => {
    // Never let logging failures break the auth flow itself.
  });
}