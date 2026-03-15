import mongoose, { Document, Model, Schema } from "mongoose";
export interface IMockQuestionDocument extends Document {
  mockTestId: mongoose.Types.ObjectId;
  type: "multiple-choice" | "fill-blank" | "true-false" | "word-order";
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  order: number;
  createdAt: Date;
}

const mockQuestionSchema = new Schema<IMockQuestionDocument>(
  {
    mockTestId: { type: Schema.Types.ObjectId, ref: "MockTest", required: true },
    type: {
      type: String,
      enum: ["multiple-choice", "fill-blank", "true-false", "word-order"],
      required: true,
    },
    prompt: { type: String, required: true },
    options: [{ type: String }],
    correctAnswer: { type: Schema.Types.Mixed, required: true },
    explanation: { type: String },
    points: { type: Number, default: 1, min: 1 },
    order: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.MockQuestion;
}

const MockQuestion: Model<IMockQuestionDocument> =
  mongoose.model<IMockQuestionDocument>("MockQuestion", mockQuestionSchema);

export default MockQuestion;
