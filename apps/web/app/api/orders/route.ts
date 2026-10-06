import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/auth/requireUser";
import { listOrders } from "../../../lib/marketplace";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "seeker" && user.role !== "provider") {
    return NextResponse.json({ error: "Orders are for seekers and providers" }, { status: 403 });
  }

  return NextResponse.json({ items: await listOrders(user.id, user.role) });
}
