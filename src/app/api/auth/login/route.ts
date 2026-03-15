import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { loginSchema } from "@/validations/authSchema";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          const key = issue.path[0]?.toString() ?? "form";
          acc[key] = issue.message;
          return acc;
        },
        {}
      );
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message, fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const { email, password } = parsed.data;
    const user = await User.findByEmail(email);

    if (!user || !(await user.comparePassword(password))) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role ?? 'user' });

    const response = NextResponse.json({
      success: true,
      data: {
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          examType: user.examType,
          role: user.role ?? 'user',
          hasCompletedOnboarding: user.hasCompletedOnboarding,
        },
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
