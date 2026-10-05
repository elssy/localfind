import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/session";
import { getProfileStatus } from "../../../../lib/profile";

export async function GET(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getSessionUser(bearer);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { hasProfile, profile } = await getProfileStatus(user.id, user.role);

  return NextResponse.json({
    hasProfile,
    profile,
    role: user.role,
    // Fields are listed one by one on purpose, so the password hash and any
    // future sensitive column can never leak by accident.
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone },
  });
}
