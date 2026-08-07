import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { revokeSession, clearSessionCookie } from "../../../../lib/auth/session";

export async function POST(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const store = await cookies();
  const cookieToken = store.get("session_token")?.value;
  const token = bearer ?? cookieToken;

  if (token) await revokeSession(token);
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}