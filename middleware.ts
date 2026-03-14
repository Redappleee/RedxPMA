import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/dashboard", "/products", "/analytics", "/team", "/notifications", "/settings"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("accessToken")?.value;
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected && !token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/analytics/:path*", "/team/:path*", "/notifications/:path*", "/settings/:path*", "/login", "/signup"]
};
