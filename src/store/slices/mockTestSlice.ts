import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import type { RootState } from '@/store'
import type { IMockTest, IMockResult, IQuestionFull } from '@/types/mockTest'

export interface IExamSetSummary {
  _id: string
  examType: string
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  totalQuestions: number
  timeLimitMins: number
  isPublished: boolean
  usageCount: number
}

interface AnswerRecord {
  userAnswer: string | string[] | null
  isCorrect: boolean | null
  flagged: boolean
  timeSpentSecs: number
  explanation?: string
}

interface ActiveTest {
  testId: string
  examType: string
  testMode: string
  section?: string
  questions: IQuestionFull[]
  currentQuestionIndex: number
  answers: Record<string, AnswerRecord>
  timeLimitMins: number
  timeRemainingMins: number
  timeRemainingSeconds: number
  status: 'idle' | 'in_progress' | 'submitting' | 'completed'
  startedAt: string | null
  examSetId: string | null
  examSetName: string | null
  isScheduled: boolean
  isRetake: boolean
}

interface MockTestState {
  activeTest: ActiveTest | null
  lastResult: IMockResult | null
  testHistory: IMockResult[]
  examSets: IExamSetSummary[]
  examSetsLoading: boolean
  isLoading: boolean
  error: string | null
}

const initialState: MockTestState = {
  activeTest: null,
  lastResult: null,
  testHistory: [],
  examSets: [],
  examSetsLoading: false,
  isLoading: false,
  error: null,
}

export const fetchExamSets = createAsyncThunk(
  'mockTest/fetchExamSets',
  async (params: { examType?: string; difficulty?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams()
      if (params.examType) query.set('examType', params.examType)
      if (params.difficulty) query.set('difficulty', params.difficulty)
      const res = await axios.get(`/api/exam-sets?${query.toString()}`)
      return res.data.data as IExamSetSummary[]
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? 'Failed to fetch exam sets')
      }
      return rejectWithValue('Failed to fetch exam sets')
    }
  }
)

export const startMockTest = createAsyncThunk(
  'mockTest/start',
  async (params: {
    examType: string
    testMode: 'full' | 'section' | 'drill'
    section?: string
    taskId?: string
    examSetId?: string
    includeCustomQuestions?: boolean
    isScheduled?: boolean
    isRetake?: boolean
  }, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/mock-tests', params)
      return res.data.data as { test: IMockTest; questions: IQuestionFull[] }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? 'Failed to start test')
      }
      return rejectWithValue('Failed to start test')
    }
  }
)

export const submitAnswer = createAsyncThunk(
  'mockTest/submitAnswer',
  async (params: {
    testId: string
    questionId: string
    userAnswer: string | string[]
    timeSpentSecs: number
    flagged?: boolean
  }, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/api/mock-tests/${params.testId}/answer`, {
        questionId: params.questionId,
        userAnswer: params.userAnswer,
        timeSpentSecs: params.timeSpentSecs,
        flagged: params.flagged ?? false,
      })
      return { questionId: params.questionId, ...res.data.data } as {
        questionId: string
        isCorrect: boolean | null
        pointsEarned: number
        explanation: string
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? 'Failed to submit answer')
      }
      return rejectWithValue('Failed to submit answer')
    }
  }
)

export const submitTest = createAsyncThunk(
  'mockTest/submit',
  async (testId: string, { rejectWithValue }) => {
    try {
      const res = await axios.post(`/api/mock-tests/${testId}/submit`)
      return res.data.data as IMockResult
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? 'Failed to submit test')
      }
      return rejectWithValue('Failed to submit test')
    }
  }
)

export const fetchTestHistory = createAsyncThunk(
  'mockTest/fetchHistory',
  async (planId: string | undefined, { rejectWithValue }) => {
    try {
      const params = planId ? `?planId=${planId}` : ''
      const res = await axios.get(`/api/mock-tests${params}`)
      return res.data.data as IMockResult[]
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? 'Failed to fetch history')
      }
      return rejectWithValue('Failed to fetch history')
    }
  }
)

const mockTestSlice = createSlice({
  name: 'mockTest',
  initialState,
  reducers: {
    setActiveTest(state, action: PayloadAction<{ test: IMockTest; questions: IQuestionFull[] }>) {
      const { test, questions } = action.payload
      state.activeTest = {
        testId: test._id,
        examType: test.examType,
        testMode: test.testMode,
        section: test.section,
        questions,
        currentQuestionIndex: 0,
        answers: {},
        timeLimitMins: test.timeLimitMins,
        timeRemainingMins: test.timeLimitMins,
        timeRemainingSeconds: test.timeLimitMins * 60,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        examSetId: test.examSetId ?? null,
        examSetName: test.examSetName ?? null,
        isScheduled: test.isScheduled ?? false,
        isRetake: test.isRetake ?? false,
      }
    },
    setCurrentQuestion(state, action: PayloadAction<number>) {
      if (state.activeTest) {
        state.activeTest.currentQuestionIndex = action.payload
      }
    },
    saveAnswer(state, action: PayloadAction<{
      questionId: string
      answer: string | string[] | null
      isCorrect: boolean | null
      flagged: boolean
      timeSpentSecs: number
      explanation?: string
    }>) {
      if (state.activeTest) {
        state.activeTest.answers[action.payload.questionId] = {
          userAnswer: action.payload.answer,
          isCorrect: action.payload.isCorrect,
          flagged: action.payload.flagged,
          timeSpentSecs: action.payload.timeSpentSecs,
          explanation: action.payload.explanation,
        }
      }
    },
    tickTimer(state) {
      if (state.activeTest && state.activeTest.timeRemainingSeconds > 0) {
        state.activeTest.timeRemainingSeconds -= 1
        state.activeTest.timeRemainingMins = Math.floor(state.activeTest.timeRemainingSeconds / 60)
      }
    },
    flagQuestion(state, action: PayloadAction<string>) {
      if (state.activeTest) {
        const existing = state.activeTest.answers[action.payload]
        if (existing) {
          existing.flagged = !existing.flagged
        } else {
          state.activeTest.answers[action.payload] = {
            userAnswer: null,
            isCorrect: null,
            flagged: true,
            timeSpentSecs: 0,
          }
        }
      }
    },
    clearActiveTest(state) {
      state.activeTest = null
    },
    setLastResult(state, action: PayloadAction<IMockResult>) {
      state.lastResult = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startMockTest.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(startMockTest.fulfilled, (state, action) => {
        state.isLoading = false
        const { test, questions } = action.payload
        state.activeTest = {
          testId: test._id,
          examType: test.examType,
          testMode: test.testMode,
          section: test.section,
          questions,
          currentQuestionIndex: 0,
          answers: {},
          timeLimitMins: test.timeLimitMins,
          timeRemainingMins: test.timeLimitMins,
          timeRemainingSeconds: test.timeLimitMins * 60,
          status: 'in_progress',
          startedAt: new Date().toISOString(),
          examSetId: test.examSetId ?? null,
          examSetName: test.examSetName ?? null,
          isScheduled: test.isScheduled ?? false,
          isRetake: test.isRetake ?? false,
        }
      })
      .addCase(startMockTest.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.payload as string
      })

      .addCase(submitAnswer.fulfilled, (state, action) => {
        if (state.activeTest) {
          const existing = state.activeTest.answers[action.payload.questionId] ?? {
            userAnswer: null,
            flagged: false,
            timeSpentSecs: 0,
          }
          state.activeTest.answers[action.payload.questionId] = {
            ...existing,
            isCorrect: action.payload.isCorrect,
            explanation: action.payload.explanation,
          }
        }
      })

      .addCase(submitTest.pending, (state) => {
        if (state.activeTest) state.activeTest.status = 'submitting'
      })
      .addCase(submitTest.fulfilled, (state, action) => {
        state.lastResult = action.payload
        state.activeTest = null
      })
      .addCase(submitTest.rejected, (state, action) => {
        if (state.activeTest) state.activeTest.status = 'in_progress'
        state.error = action.payload as string
      })

      .addCase(fetchTestHistory.fulfilled, (state, action) => {
        state.testHistory = action.payload
      })

      .addCase(fetchExamSets.pending, (state) => {
        state.examSetsLoading = true
      })
      .addCase(fetchExamSets.fulfilled, (state, action) => {
        state.examSetsLoading = false
        state.examSets = action.payload
      })
      .addCase(fetchExamSets.rejected, (state) => {
        state.examSetsLoading = false
      })
  },
})

export const {
  setActiveTest,
  setCurrentQuestion,
  saveAnswer,
  tickTimer,
  flagQuestion,
  clearActiveTest,
  setLastResult,
} = mockTestSlice.actions

export default mockTestSlice.reducer

// Selectors
export const selectActiveTest = (state: RootState) => state.mockTest.activeTest
export const selectCurrentQuestion = (state: RootState) => {
  const t = state.mockTest.activeTest
  if (!t) return null
  return t.questions[t.currentQuestionIndex] ?? null
}
export const selectCurrentAnswer = (questionId: string) => (state: RootState) =>
  state.mockTest.activeTest?.answers[questionId] ?? null
export const selectTestProgress = (state: RootState) => {
  const t = state.mockTest.activeTest
  if (!t) return { answered: 0, total: 0, percentage: 0 }
  const answered = Object.values(t.answers).filter(a => a.userAnswer !== null).length
  const total = t.questions.length
  return { answered, total, percentage: total > 0 ? Math.round((answered / total) * 100) : 0 }
}
export const selectTimeDisplay = (state: RootState) => {
  const secs = state.mockTest.activeTest?.timeRemainingSeconds ?? 0
  const m = Math.floor(secs / 60).toString().padStart(2, '0')
  const s = (secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
export const selectIsTestActive = (state: RootState) => state.mockTest.activeTest !== null
export const selectLastResult = (state: RootState) => state.mockTest.lastResult
export const selectTestHistory = (state: RootState) => state.mockTest.testHistory
export const selectExamSets = (state: RootState) => state.mockTest.examSets
export const selectExamSetsLoading = (state: RootState) => state.mockTest.examSetsLoading
export const selectExamSetById = (id: string) => (state: RootState) =>
  state.mockTest.examSets.find(s => s._id === id) ?? null
