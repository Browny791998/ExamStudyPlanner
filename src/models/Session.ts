import mongoose, { Document, Model, Schema } from "mongoose";

export interface ISessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  studyPlanId?: mongoose.Types.ObjectId;
  dailyTaskId?: mongoose.Types.ObjectId;
  subject: string;
  startTime: Date;
  endTime?: Date;
  durationMinutes?: number;
  notes?: string;
  createdAt: Date;
}

const sessionSchema = new Schema<ISessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studyPlanId: { type: Schema.Types.ObjectId, ref: "StudyPlan" },
    dailyTaskId: { type: Schema.Types.ObjectId, ref: "DailyTask" },
    subject: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    durationMinutes: { type: Number },
    notes: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const Session: Model<ISessionDocument> =
  mongoose.models.Session ||
  mongoose.model<ISessionDocument>("Session", sessionSchema);

export default Session;
