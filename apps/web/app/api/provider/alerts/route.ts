import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../lib/auth/requireUser";
import { listProviderAlerts } from "../../../../lib/marketplace";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "provider") {
    return NextResponse.json({ error: "Only providers have alerts" }, { status: 403 });
  }

  const result = await listProviderAlerts(user.id);
  if (!result) {
    return NextResponse.json({ error: "Finish setting up your business profile first." }, { status: 403 });
  }
  return NextResponse.json(result);
}
