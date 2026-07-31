import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === "production",
  });

  const { pathname } = request.nextUrl;
  const isProtected =
    pathname.startsWith("/account") || pathname.startsWith("/admin");
  const isAdminRoute = pathname.startsWith("/admin");

  if (!token && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute && token?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
