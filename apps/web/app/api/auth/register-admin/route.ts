import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/db";
import { hashPassword } from "../../../../lib/auth/hash";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(9),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-admin-setup-secret");
  if (secret !== process.env.ADMIN_SETUP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const { password, ...rest } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: rest.email } });
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  const passwordHash = await hashPassword(password);
  const admin = await prisma.user.create({
    data: { ...rest, passwordHash, role: "admin", emailVerified: true },
  });

  return NextResponse.json({ id: admin.id, email: admin.email });
}