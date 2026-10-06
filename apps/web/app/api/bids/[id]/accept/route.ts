import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../../lib/auth/requireUser";
import { BidNotAvailableError, acceptBid } from "../../../../../lib/marketplace";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "seeker") {
    return NextResponse.json({ error: "Only seekers can accept bids" }, { status: 403 });
  }

  try {
    const order = await acceptBid(user.id, params.id);
    if (!order) return NextResponse.json({ error: "Bid not found" }, { status: 404 });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof BidNotAvailableError) {
      return NextResponse.json(
        { error: "This bid is no longer available. The request may already be closed." },
        { status: 409 }
      );
    }
    throw error;
  }
}
