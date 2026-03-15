import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  examType: "IELTS" | "TOEFL" | "JLPT" | "SAT" | null;
  targetScore: string | null;
  examDate: Date | null;
  hasCompletedOnboarding: boolean;
  role: "user" | "admin";
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: number | null;
  comparePassword(plain: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
}

const userSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    examType: {
      type: String,
      enum: ["IELTS", "TOEFL", "JLPT", "SAT"],
      default: null,
    },
    targetScore: { type: String, default: null },
    examDate: { type: Date, default: null },
    hasCompletedOnboarding: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    googleAccessToken: { type: String, default: null, select: false },
    googleRefreshToken: { type: String, default: null, select: false },
    googleTokenExpiry: { type: Number, default: null, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("passwordHash")) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

userSchema.methods.comparePassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() }).select("+passwordHash");
};

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.User;
}

const User: IUserModel = mongoose.model<IUserDocument, IUserModel>(
  "User",
  userSchema
);

export default User;
