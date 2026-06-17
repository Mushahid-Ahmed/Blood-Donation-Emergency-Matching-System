import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

// Define role-to-route mappings
const ROLE_DASHBOARDS: Record<Role, string> = {
  [Role.DONOR]: "/donor",
  [Role.ATTENDANT]: "/attendant",
  [Role.VERIFIER]: "/verifier",
  [Role.COORDINATOR]: "/coordinator",
  [Role.ADMIN]: "/admin",
};

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  const isAuthRoute = nextUrl.pathname === "/login" || nextUrl.pathname === "/register";
  const isDashboardRoute =
    nextUrl.pathname.startsWith("/donor") ||
    nextUrl.pathname.startsWith("/attendant") ||
    nextUrl.pathname.startsWith("/verifier") ||
    nextUrl.pathname.startsWith("/coordinator") ||
    nextUrl.pathname.startsWith("/admin");

  // Redirect logged-in users away from login/register to their dashboard
  if (isAuthRoute) {
    if (isLoggedIn && userRole) {
      return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], nextUrl));
    }
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (isDashboardRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    if (userRole) {
      const path = nextUrl.pathname;

      // Check if user is accessing a folder that matches their role
      if (path.startsWith("/donor") && userRole !== Role.DONOR) {
        return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], nextUrl));
      }
      if (path.startsWith("/attendant") && userRole !== Role.ATTENDANT) {
        return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], nextUrl));
      }
      if (path.startsWith("/verifier") && userRole !== Role.VERIFIER) {
        return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], nextUrl));
      }
      if (path.startsWith("/coordinator") && userRole !== Role.COORDINATOR) {
        return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], nextUrl));
      }
      if (path.startsWith("/admin") && userRole !== Role.ADMIN) {
        return NextResponse.redirect(new URL(ROLE_DASHBOARDS[userRole], nextUrl));
      }
    }
  }

  return NextResponse.next();
});

// Configure matchers for middleware intercept
export const config = {
  matcher: [
    "/login",
    "/register",
    "/donor/:path*",
    "/attendant/:path*",
    "/verifier/:path*",
    "/coordinator/:path*",
    "/admin/:path*",
  ],
};
