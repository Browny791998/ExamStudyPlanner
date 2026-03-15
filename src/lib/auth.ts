import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "auth-token";

export interface JwtPayload {
  userId: string;
  email: string;
  role?: 'user' | 'admin';
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export function getCurrentUser(request: NextRequest): JwtPayload | null {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

export function requireAuth(request: NextRequest): JwtPayload | null {
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken) return verifyToken(cookieToken);

  const headerToken = getTokenFromHeader(request.headers.get("authorization"));
  if (headerToken) return verifyToken(headerToken);

  return null;
}

export async function isAdmin(request: NextRequest): Promise<boolean> {
  const payload = requireAuth(request);
  if (!payload) return false;

  try {
    const { connectDB } = await import("@/lib/mongodb");
    await connectDB();
    const User = (await import("@/models/User")).default;
    const user = await User.findById(payload.userId).select("role").lean();
    return (user as { role?: string } | null)?.role === "admin";
  } catch {
    return false;
  }
}

export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const payload = requireAuth(request);
  if (!payload) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const admin = await isAdmin(request);
  if (!admin) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  return null;
}
