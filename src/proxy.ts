import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/study-plan",
  "/mock-test",
  "/calendar",
  "/progress",
  "/settings",
  "/admin",
];

const AUTH_PAGES = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));
  const isAdminRoute = pathname.startsWith("/admin");
  const isOnboarding = pathname.startsWith("/onboarding");

  const user = getCurrentUser(request);
  const role = user?.role ?? "user";

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user) {
    // Redirect authenticated users away from auth pages
    if (isAuthPage) {
      const dest = role === "admin" ? "/admin" : "/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }

    // Admin visiting /onboarding → /admin
    if (isOnboarding && role === "admin") {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Non-admin visiting /admin/* → /dashboard
    if (isAdminRoute && role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
