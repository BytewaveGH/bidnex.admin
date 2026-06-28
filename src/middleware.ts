import { NextResponse } from "next/server";

import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  const isDashboard = pathname.startsWith("/dashboard");
  const isAuthRoute = pathname.startsWith("/auth/");

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/v1/login", req.url));
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon\\.ico).*)"],
};
