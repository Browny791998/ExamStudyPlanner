import mongoose, { Document, Model, Schema } from 'mongoose'

interface ISectionScoreEmbed {
  section: string
  score: number
  maxScore: number
  percentage: number
  weakAreas: string[]
}

export interface IMockResultDocument extends Document {
  userId: mongoose.Types.ObjectId
  planId: mongoose.Types.ObjectId
  testId: mongoose.Types.ObjectId
  examType: 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT'
  testMode: 'full' | 'section' | 'drill'
  totalScore: number
  scaledScore: string
  sectionScores: ISectionScoreEmbed[]
  totalQuestions: number
  correctAnswers: number
  timeTakenMins: number
  weakAreas: string[]
  strongAreas: string[]
  recommendations: string[]
  createdAt: Date
}

const sectionScoreSchema = new Schema<ISectionScoreEmbed>({
  section: { type: String, required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  percentage: { type: Number, required: true },
  weakAreas: [{ type: String }],
}, { _id: false })

const mockResultSchema = new Schema<IMockResultDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  planId: { type: Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
  testId: { type: Schema.Types.ObjectId, ref: 'MockTest', required: true, unique: true },
  examType: { type: String, enum: ['IELTS', 'TOEFL', 'JLPT', 'SAT'], required: true },
  testMode: { type: String, enum: ['full', 'section', 'drill'], required: true },
  totalScore: { type: Number, required: true },
  scaledScore: { type: String, required: true },
  sectionScores: [sectionScoreSchema],
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  timeTakenMins: { type: Number, required: true },
  weakAreas: [{ type: String }],
  strongAreas: [{ type: String }],
  recommendations: [{ type: String }],
}, { timestamps: { createdAt: true, updatedAt: false } })

delete (mongoose.models as Record<string, unknown>).MockResult
const MockResult: Model<IMockResultDocument> = mongoose.model<IMockResultDocument>('MockResult', mockResultSchema)
export default MockResult
