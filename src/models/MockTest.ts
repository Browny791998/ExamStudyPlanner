import mongoose, { Document, Model, Schema } from 'mongoose'

interface IMockTestQuestionEmbed {
  questionId: mongoose.Types.ObjectId
  order: number
  userAnswer: string | string[] | null
  isCorrect: boolean | null
  pointsEarned: number
  timeSpentSecs: number
  flagged: boolean
}

export interface IMockTestDocument extends Document {
  userId: mongoose.Types.ObjectId
  planId: mongoose.Types.ObjectId
  taskId?: mongoose.Types.ObjectId
  examType: 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT'
  testMode: 'full' | 'section' | 'drill'
  section?: string
  status: 'in_progress' | 'completed' | 'abandoned'
  questions: IMockTestQuestionEmbed[]
  startedAt: Date
  completedAt: Date | null
  timeLimitMins: number
  timeRemainingMins: number
  totalPoints: number
  earnedPoints: number
  examSetId: mongoose.Types.ObjectId | null
  examSetName: string | null
  isScheduled: boolean
  isRetake: boolean
  createdAt: Date
  updatedAt: Date
}

const questionEmbedSchema = new Schema<IMockTestQuestionEmbed>({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  order: { type: Number, required: true },
  userAnswer: { type: Schema.Types.Mixed, default: null },
  isCorrect: { type: Boolean, default: null },
  pointsEarned: { type: Number, default: 0 },
  timeSpentSecs: { type: Number, default: 0 },
  flagged: { type: Boolean, default: false },
}, { _id: false })

const mockTestSchema = new Schema<IMockTestDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planId: { type: Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
  taskId: { type: Schema.Types.ObjectId, ref: 'DailyTask' },
  examType: { type: String, enum: ['IELTS', 'TOEFL', 'JLPT', 'SAT'], required: true },
  testMode: { type: String, enum: ['full', 'section', 'drill'], required: true },
  section: { type: String },
  status: { type: String, enum: ['in_progress', 'completed', 'abandoned'], default: 'in_progress' },
  questions: [questionEmbedSchema],
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  timeLimitMins: { type: Number, required: true },
  timeRemainingMins: { type: Number, required: true },
  totalPoints: { type: Number, default: 0 },
  earnedPoints: { type: Number, default: 0 },
  examSetId: { type: Schema.Types.ObjectId, ref: 'ExamSet', default: null },
  examSetName: { type: String, default: null },
  isScheduled: { type: Boolean, default: false },
  isRetake: { type: Boolean, default: false },
}, { timestamps: true })

delete (mongoose.models as Record<string, unknown>).MockTest
const MockTest: Model<IMockTestDocument> = mongoose.model<IMockTestDocument>('MockTest', mockTestSchema)
export default MockTest
