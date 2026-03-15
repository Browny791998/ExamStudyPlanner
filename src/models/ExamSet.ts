import mongoose, { Document, Model, Schema } from 'mongoose'

export interface IExamSetSection {
  section: string
  questions: mongoose.Types.ObjectId[]
  questionCount: number
}

export interface IExamSetDocument extends Document {
  examType: 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT'
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  sections: IExamSetSection[]
  totalQuestions: number
  timeLimitMins: number
  isPublished: boolean
  usageCount: number
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const examSetSectionSchema = new Schema<IExamSetSection>(
  {
    section: { type: String, required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    questionCount: { type: Number, default: 0 },
  },
  { _id: false }
)

const examSetSchema = new Schema<IExamSetDocument>(
  {
    examType: { type: String, enum: ['IELTS', 'TOEFL', 'JLPT', 'SAT'], required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true, index: true },
    sections: [examSetSectionSchema],
    totalQuestions: { type: Number, default: 0 },
    timeLimitMins: { type: Number, required: true },
    isPublished: { type: Boolean, default: false, index: true },
    usageCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

// Unique name per examType
examSetSchema.index({ examType: 1, name: 1 }, { unique: true })

// Pre-save: recalculate totalQuestions from sections
examSetSchema.pre('save', function () {
  this.totalQuestions = this.sections.reduce((sum, s) => sum + s.questions.length, 0)
  this.sections.forEach((s) => { s.questionCount = s.questions.length })
})

delete (mongoose.models as Record<string, unknown>).ExamSet
const ExamSet: Model<IExamSetDocument> = mongoose.model<IExamSetDocument>('ExamSet', examSetSchema)
export default ExamSet
