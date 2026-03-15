import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IStudyPlanDocument extends Document {
  userId: mongoose.Types.ObjectId
  title: string
  examType: 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT'
  targetScore: string
  examDate: Date
  startDate: Date
  endDate: Date
  status: 'active' | 'completed' | 'paused'
  overallProgress: number
  weeklyGoals: { week: number; focus: string; targetTasksCount: number }[]
  createdAt: Date
  updatedAt: Date
}

const weeklyGoalSchema = new Schema({ week: Number, focus: String, targetTasksCount: Number }, { _id: false })

const studyPlanSchema = new Schema<IStudyPlanDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    examType: { type: String, enum: ['IELTS', 'TOEFL', 'JLPT', 'SAT'], required: true },
    targetScore: { type: String, required: true },
    examDate: { type: Date, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    overallProgress: { type: Number, default: 0 },
    weeklyGoals: [weeklyGoalSchema],
  },
  { timestamps: true }
)

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.StudyPlan
}

const StudyPlan: Model<IStudyPlanDocument> = mongoose.model<IStudyPlanDocument>('StudyPlan', studyPlanSchema)
export default StudyPlan
