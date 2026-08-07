import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("session_token")?.value;
  const isAuthRoute = req.nextUrl.pathname.startsWith("/login");

  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/providers/:path*", "/transactions/:path*", "/disputes/:path*", "/users/:path*", "/settings/:path*", "/tokens/:path*"],
};