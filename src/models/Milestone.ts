import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IMilestoneDocument extends Document {
  planId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  title: string
  description: string
  weekNumber: number
  targetDate: Date
  achieved: boolean
  achievedAt: Date | null
  createdAt: Date
}

const milestoneSchema = new Schema<IMilestoneDocument>(
  {
    planId: { type: Schema.Types.ObjectId, ref: 'StudyPlan', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    weekNumber: { type: Number, required: true },
    targetDate: { type: Date, required: true },
    achieved: { type: Boolean, default: false },
    achievedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Milestone
}

const Milestone: Model<IMilestoneDocument> = mongoose.model<IMilestoneDocument>('Milestone', milestoneSchema)
export default Milestone
