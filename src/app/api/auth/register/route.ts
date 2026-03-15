import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { registerSchema } from "@/validations/authSchema";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

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

    const { name, email, password } = parsed.data;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const user = await User.create({ name, email, passwordHash: password });
    const token = signToken({ userId: user._id.toString(), email: user.email, role: user.role ?? 'user' });

    const response = NextResponse.json(
      {
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
          message: "Account created successfully",
        },
      },
      { status: 201 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (err) {
    const message =
      process.env.NODE_ENV === "development" && err instanceof Error
        ? err.message
        : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
