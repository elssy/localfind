import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/session";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getSessionUser(bearer);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role, emailVerified: user.emailVerified },
  });
}