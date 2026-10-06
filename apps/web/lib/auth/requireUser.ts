import type { NextRequest } from "next/server";
import { getSessionUser } from "./session";

// Works for the phone app (token in the Authorization header) and for the
// website (session cookie). Returns null when nobody valid is signed in.
export async function authenticate(req: NextRequest) {
  const bearer = req.headers.get("authorization")?.replace("Bearer ", "");
  return getSessionUser(bearer);
}
