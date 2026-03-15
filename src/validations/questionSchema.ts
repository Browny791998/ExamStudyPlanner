import { z } from "zod";
import { startOfDay } from "date-fns";

const questionBaseSchema = z.object({
  examType: z.enum(["IELTS", "TOEFL", "JLPT", "SAT"]),
  section: z.string().min(1, "Section is required"),
  questionType: z.enum([
    "multiple_choice",
    "fill_blank",
    "true_false_ng",
    "word_order",
    "matching",
    "essay",
    "grid_in",
  ]),
  difficulty: z.enum(["easy", "medium", "hard"]),
  points: z.number().min(0).max(10).optional(),
  question: z.string().min(5, "Question must be at least 5 characters").max(2000),
  passage: z.string().max(5000).optional(),
  options: z.array(z.string()).max(6).optional(),
  blanks: z
    .array(
      z.object({
        index: z.number(),
        answer: z.string().min(1, "Answer is required"),
        hint: z.string().optional(),
      })
    )
    .optional(),
  words: z.array(z.string()).optional(),
  correctAnswer: z.string().optional(),
  correctOrder: z.array(z.string()).optional(),
  matchingPairs: z
    .array(
      z.object({
        left: z.string().min(1),
        right: z.string().min(1),
      })
    )
    .optional(),
  explanation: z.string().min(5, "Explanation must be at least 5 characters").max(1000).optional(),
  tags: z.array(z.string()).optional(),
});

// Partial schema for edit mode (no superRefine needed — server validates)
export const questionUpdateSchema = questionBaseSchema.partial();

export const questionSchema = questionBaseSchema.superRefine((data, ctx) => {
    if (data.questionType === "multiple_choice") {
      if (!data.options?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Multiple choice questions require options",
          path: ["options"],
        });
      }
      if (!data.correctAnswer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Multiple choice questions require a correct answer",
          path: ["correctAnswer"],
        });
      }
    }

    if (data.questionType === "fill_blank") {
      if (!data.blanks?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Fill in the blank questions require at least one blank",
          path: ["blanks"],
        });
      }
    }

    if (data.questionType === "word_order") {
      if (!data.words?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Word order questions require words",
          path: ["words"],
        });
      }
      if (!data.correctOrder?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Word order questions require a correct order",
          path: ["correctOrder"],
        });
      }
    }

    if (data.questionType === "true_false_ng") {
      if (!["TRUE", "FALSE", "NOT GIVEN"].includes(data.correctAnswer ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "True/False/NG questions require TRUE, FALSE, or NOT GIVEN",
          path: ["correctAnswer"],
        });
      }
    }

    if (data.questionType === "grid_in") {
      if (!data.correctAnswer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Grid-in questions require a correct answer",
          path: ["correctAnswer"],
        });
      }
    }

    if (data.questionType === "matching") {
      if (!data.matchingPairs?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Matching questions require matching pairs",
          path: ["matchingPairs"],
        });
      }
    }
  });

export type QuestionFormData = z.infer<typeof questionSchema>;

export const dailyTaskSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  scheduledDate: z.string().refine(
    (val) => new Date(val) >= startOfDay(new Date()),
    { message: "Cannot schedule tasks in the past" }
  ),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().max(500).optional(),
  skillFocus: z.enum([
    "Reading",
    "Writing",
    "Listening",
    "Speaking",
    "Vocabulary",
    "Grammar",
    "Math",
    "Mock Test",
  ]),
  taskType: z.enum(["drill", "mock_test", "revision", "vocabulary", "essay"]),
  durationMins: z.number().min(5, "Minimum 5 minutes").max(480, "Maximum 8 hours"),
});

export type DailyTaskFormData = z.infer<typeof dailyTaskSchema>;
