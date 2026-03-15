import mongoose, { Document, Model, Schema } from "mongoose";

export type StandardExamType = "IELTS" | "TOEFL" | "JLPT" | "SAT";
export type ExamType = StandardExamType | (string & {});
export type QuestionType =
  | "multiple_choice"
  | "fill_blank"
  | "true_false_ng"
  | "word_order"
  | "matching"
  | "essay"
  | "grid_in";
export type Difficulty = "easy" | "medium" | "hard";

export interface IBlank {
  index: number;
  answer: string;
  hint?: string;
}

export interface IMatchingPair {
  left: string;
  right: string;
}

export interface IQuestionDocument extends Document {
  examType: ExamType;
  section: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  points: number;
  question: string;
  passage?: string;
  options?: string[];
  blanks?: IBlank[];
  words?: string[];
  correctAnswer?: string;
  correctOrder?: string[];
  matchingPairs?: IMatchingPair[];
  explanation: string;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  isCustom: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  visibility: "public" | "private";
  usedInSets: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const blankSchema = new Schema<IBlank>(
  { index: Number, answer: { type: String, required: true }, hint: String },
  { _id: false }
);

const matchingPairSchema = new Schema<IMatchingPair>(
  { left: { type: String, required: true }, right: { type: String, required: true } },
  { _id: false }
);

const questionSchema = new Schema<IQuestionDocument>(
  {
    examType: { type: String, required: true, index: true },
    section: { type: String, required: true, index: true },
    questionType: {
      type: String,
      enum: ["multiple_choice", "fill_blank", "true_false_ng", "word_order", "matching", "essay", "grid_in"],
      required: true,
      index: true,
    },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true, index: true },
    points: { type: Number, default: 1, min: 0, max: 10 },
    question: { type: String, required: true },
    passage: { type: String },
    options: [{ type: String }],
    blanks: [blankSchema],
    words: [{ type: String }],
    correctAnswer: { type: String },
    correctOrder: [{ type: String }],
    matchingPairs: [matchingPairSchema],
    explanation: { type: String, required: true },
    tags: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isCustom: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    usedInSets: [{ type: Schema.Types.ObjectId, ref: 'ExamSet', default: [] }],
  },
  { timestamps: true }
);

questionSchema.index({ createdBy: 1, isCustom: 1 });
questionSchema.index({ isDeleted: 1, examType: 1, questionType: 1 });

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.Question;
}

const Question: Model<IQuestionDocument> = mongoose.model<IQuestionDocument>(
  "Question",
  questionSchema
);

export default Question;
