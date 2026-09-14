import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const protectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/doctors") ||
    pathname.startsWith("/patients");

  const protectedApi =
    pathname.startsWith("/api/doctors") ||
    pathname.startsWith("/api/patients") ||
    pathname.startsWith("/api/dashboard");

  if ((protectedPage || protectedApi) && !session) {
    if (protectedApi) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/login" && session) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/doctors/:path*",
    "/patients/:path*",
    "/api/doctors/:path*",
    "/api/patients/:path*",
    "/api/dashboard/:path*",
    "/login",
  ],
};
