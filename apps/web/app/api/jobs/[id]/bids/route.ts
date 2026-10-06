import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../../lib/auth/requireUser";
import { bidLimiter, withinLimit } from "../../../../../lib/auth/rateLimit";
import {
  AlreadyBidError,
  CategoryMismatchError,
  JobClosedError,
  JobNotFoundError,
  NotAProviderError,
  ProviderNotApprovedError,
  getSeekerJobBids,
  placeBid,
} from "../../../../../lib/marketplace";
import { placeBidSchema } from "../../../../../lib/marketplaceSchemas";

// A seeker reads the bids on their own request.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "seeker") {
    return NextResponse.json({ error: "Only seekers can view bids on a request" }, { status: 403 });
  }

  const result = await getSeekerJobBids(user.id, params.id);
  if (!result) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  return NextResponse.json(result);
}

// A provider sends a bid on a request.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "provider") {
    return NextResponse.json({ error: "Only providers can send bids" }, { status: 403 });
  }

  if (!(await withinLimit(bidLimiter, user.id, { failOpen: false }))) {
    return NextResponse.json({ error: "You have sent a lot of bids. Try again later." }, { status: 429 });
  }

  const parsed = placeBidSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid bid" },
      { status: 400 }
    );
  }

  try {
    const bid = await placeBid(user.id, params.id, parsed.data);
    return NextResponse.json({ bid }, { status: 201 });
  } catch (error) {
    if (error instanceof ProviderNotApprovedError) {
      return NextResponse.json(
        { error: "Your business needs to be approved before you can send bids." },
        { status: 403 }
      );
    }
    if (error instanceof NotAProviderError) {
      return NextResponse.json({ error: "Finish setting up your business profile first." }, { status: 403 });
    }
    if (error instanceof JobNotFoundError) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (error instanceof JobClosedError) {
      return NextResponse.json({ error: "This request is no longer open." }, { status: 409 });
    }
    if (error instanceof CategoryMismatchError) {
      return NextResponse.json({ error: "This request is outside your category." }, { status: 403 });
    }
    if (error instanceof AlreadyBidError) {
      return NextResponse.json({ error: "You have already sent a bid on this request." }, { status: 409 });
    }
    throw error;
  }
}
