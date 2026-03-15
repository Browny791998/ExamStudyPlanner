import { z } from "zod";

export const mockTestSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  examType: z.string().min(1, "Exam type is required"),
  timeLimit: z.coerce.number().min(1, "Time limit must be at least 1 minute"),
});

export const questionSchema = z.object({
  type: z.enum(["multiple-choice", "fill-blank", "true-false", "word-order"]),
  prompt: z.string().min(5, "Question prompt is required"),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.array(z.string())]),
  explanation: z.string().optional(),
  points: z.coerce.number().min(1).default(1),
  order: z.coerce.number().min(0).default(0),
});

export type MockTestInput = z.infer<typeof mockTestSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
