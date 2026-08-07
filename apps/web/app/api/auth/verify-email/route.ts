import { NextRequest, NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "../../../../lib/auth/tokens";

export async function POST(req: NextRequest) {
  const { token } = await req.json().catch(() => ({ token: null }));
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const userId = await consumeEmailVerificationToken(token);
  if (!userId) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });

  return NextResponse.json({ ok: true });
}