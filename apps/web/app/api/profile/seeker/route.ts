import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth/session";
import {
  seekerProfileSchema,
  createSeekerProfile,
  updateSeekerProfile,
  ProfileAlreadyExistsError,
} from "../../../../lib/profile";

async function requireSeekerUser(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  const user = await getSessionUser(bearer);
  if (!user) {
    return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };
  }
  if (user.role !== "seeker") {
    return {
      error: NextResponse.json(
        { error: "Only seeker accounts can manage a seeker profile" },
        { status: 403 }
      ),
    };
  }
  return { user };
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireSeekerUser(req);
  if (error) return error;

  const parsed = seekerProfileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const profile = await createSeekerProfile(user!.id, parsed.data);
    return NextResponse.json({ profile });
  } catch (e) {
    if (e instanceof ProfileAlreadyExistsError) {
      return NextResponse.json(
        { error: "Profile already exists. Use PATCH to update it." },
        { status: 400 }
      );
    }
    throw e;
  }
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireSeekerUser(req);
  if (error) return error;

  const parsed = seekerProfileSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const profile = await updateSeekerProfile(user!.id, parsed.data);
  return NextResponse.json({ profile });
}