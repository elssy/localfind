import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../lib/auth/requireUser";
import { getPublicProvider } from "../../../../lib/marketplace";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const provider = await getPublicProvider(params.id);
  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  return NextResponse.json(provider);
}
