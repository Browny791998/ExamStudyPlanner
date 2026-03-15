import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    data: { message: "Logged out" },
  });
  clearAuthCookie(response);
  return response;
}
