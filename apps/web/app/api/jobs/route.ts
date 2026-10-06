import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/auth/requireUser";
import { jobLimiter, withinLimit } from "../../../lib/auth/rateLimit";
import { createJob, listSeekerJobs } from "../../../lib/marketplace";
import { createJobSchema } from "../../../lib/marketplaceSchemas";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "seeker") {
    return NextResponse.json({ error: "Only seekers have requests" }, { status: 403 });
  }

  return NextResponse.json({ items: await listSeekerJobs(user.id) });
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (user.role !== "seeker") {
    return NextResponse.json({ error: "Only seekers can make requests" }, { status: 403 });
  }

  if (!(await withinLimit(jobLimiter, user.id, { failOpen: false }))) {
    return NextResponse.json({ error: "You have made a lot of requests. Try again later." }, { status: 429 });
  }

  const parsed = createJobSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const job = await createJob(user.id, parsed.data);
  return NextResponse.json({ job }, { status: 201 });
}
