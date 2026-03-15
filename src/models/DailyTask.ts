import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IDailyTaskDocument extends Document {
  planId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId
  scheduledDate: Date
  dayNumber: number
  weekNumber: number
  title: string
  description: string
  skillFocus: 'Reading' | 'Writing' | 'Listening' | 'Speaking' | 'Vocabulary' | 'Grammar' | 'Math' | 'Mock Test' | 'Study' | 'Review' | 'Practice' | 'Other'
  taskType: 'drill' | 'mock_test' | 'revision' | 'vocabulary' | 'essay'
  durationMins: number
  completed: boolean
  completedAt: Date | null
  gcalEventId: string | null
  notes: string
  isCustom: boolean
  examSetId: mongoose.Types.ObjectId | null
  examSetName: string | null
  createdAt: Date
}

const dailyTaskSchema = new Schema<IDailyTaskDocument>(
  {
    planId: { type: Schema.Types.ObjectId, ref: 'StudyPlan', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scheduledDate: { type: Date, required: true, index: true },
    dayNumber: { type: Number, required: true },
    weekNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    skillFocus: {
      type: String,
      enum: ['Reading', 'Writing', 'Listening', 'Speaking', 'Vocabulary', 'Grammar', 'Math', 'Mock Test', 'Study', 'Review', 'Practice', 'Other'],
      required: true,
    },
    taskType: { type: String, enum: ['drill', 'mock_test', 'revision', 'vocabulary', 'essay'], required: true },
    durationMins: { type: Number, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    gcalEventId: { type: String, default: null },
    notes: { type: String, default: '' },
    isCustom: { type: Boolean, default: false },
    examSetId: { type: Schema.Types.ObjectId, ref: 'ExamSet', default: null },
    examSetName: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.DailyTask
}

const DailyTask: Model<IDailyTaskDocument> = mongoose.model<IDailyTaskDocument>('DailyTask', dailyTaskSchema)
export default DailyTask
