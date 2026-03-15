import { z } from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be at most 50 characters"),
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .check(
        z.refine((v) => /[A-Z]/.test(v), "Password must contain at least one uppercase letter"),
        z.refine((v) => /[0-9]/.test(v), "Password must contain at least one number"),
        z.refine((v) => /[^A-Za-z0-9]/.test(v), "Password must contain at least one special character")
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;

// Backwards-compatible aliases
export type RegisterInput = RegisterFormData;
export type LoginInput = LoginFormData;
