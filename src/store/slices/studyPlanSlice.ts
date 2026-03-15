import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import axios from 'axios'
import type { RootState } from '@/store'
import type { IStudyPlan, IDailyTask } from '@/types/studyPlan'
import type { CreateStudyPlanFormData } from '@/validations/studyPlanSchema'
import { startOfDay } from 'date-fns'

interface StudyPlanState {
  activePlan: IStudyPlan | null
  todayTasks: IDailyTask[]
  isLoading: boolean
  isGenerating: boolean
  error: string | null
}

const initialState: StudyPlanState = {
  activePlan: null,
  todayTasks: [],
  isLoading: false,
  isGenerating: false,
  error: null,
}

export const createStudyPlan = createAsyncThunk(
  'studyPlan/create',
  async (formData: CreateStudyPlanFormData, { rejectWithValue }) => {
    try {
      const res = await axios.post('/api/study-plans', formData)
      return res.data.data.plan as IStudyPlan
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? 'Failed to create study plan')
      }
      return rejectWithValue('Failed to create study plan')
    }
  }
)

export const fetchActivePlan = createAsyncThunk(
  'studyPlan/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get('/api/study-plans')
      return res.data.data.plan as IStudyPlan | null
    } catch {
      return rejectWithValue(null)
    }
  }
)

export const fetchTodayTasks = createAsyncThunk(
  'studyPlan/fetchTodayTasks',
  async (_, { rejectWithValue }) => {
    try {
      const today = startOfDay(new Date()).toISOString()
      const res = await axios.get(`/api/daily-tasks?date=${encodeURIComponent(today)}`)
      return res.data.data.tasks as IDailyTask[]
    } catch {
      return rejectWithValue([])
    }
  }
)

export const completeTask = createAsyncThunk(
  'studyPlan/completeTask',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const res = await axios.patch(`/api/daily-tasks/${taskId}`, { completed: true })
      return { taskId, overallProgress: res.data.data.overallProgress as number }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue(err.response?.data?.error ?? 'Failed to complete task')
      }
      return rejectWithValue('Failed to complete task')
    }
  }
)

const studyPlanSlice = createSlice({
  name: 'studyPlan',
  initialState,
  reducers: {
    clearStudyPlanError(state) {
      state.error = null
    },
    // Legacy reducers kept for backward compatibility
    setActivePlan(state, action: PayloadAction<IStudyPlan>) {
      state.activePlan = action.payload
    },
    clearActivePlan(state) {
      state.activePlan = null
    },
  },
  extraReducers: (builder) => {
    // createStudyPlan
    builder
      .addCase(createStudyPlan.pending, (state) => {
        state.isGenerating = true
        state.error = null
      })
      .addCase(createStudyPlan.fulfilled, (state, action) => {
        state.isGenerating = false
        state.activePlan = action.payload
      })
      .addCase(createStudyPlan.rejected, (state, action) => {
        state.isGenerating = false
        state.error = action.payload as string
      })

    // fetchActivePlan
    builder
      .addCase(fetchActivePlan.pending, (state) => {
        state.isLoading = true
      })
      .addCase(fetchActivePlan.fulfilled, (state, action) => {
        state.isLoading = false
        state.activePlan = action.payload
      })
      .addCase(fetchActivePlan.rejected, (state) => {
        state.isLoading = false
      })

    // fetchTodayTasks
    builder.addCase(fetchTodayTasks.fulfilled, (state, action) => {
      state.todayTasks = action.payload
    })

    // completeTask — optimistic update
    builder
      .addCase(completeTask.pending, (state, action) => {
        const taskId = action.meta.arg
        const task = state.todayTasks.find((t) => t._id === taskId)
        if (task) task.completed = true
      })
      .addCase(completeTask.fulfilled, (state, action) => {
        if (state.activePlan) {
          state.activePlan.overallProgress = action.payload.overallProgress
        }
      })
      .addCase(completeTask.rejected, (state, action) => {
        // revert optimistic update
        const taskId = action.meta.arg
        const task = state.todayTasks.find((t) => t._id === taskId)
        if (task) task.completed = false
      })
  },
})

export const { clearStudyPlanError, setActivePlan, clearActivePlan } = studyPlanSlice.actions
export default studyPlanSlice.reducer

export const selectActivePlan = (state: RootState) => state.studyPlan.activePlan
export const selectTodayTasks = (state: RootState) => state.studyPlan.todayTasks
export const selectIsGenerating = (state: RootState) => state.studyPlan.isGenerating
export const selectPlanProgress = (state: RootState) => state.studyPlan.activePlan?.overallProgress ?? 0
export const selectStudyPlanLoading = (state: RootState) => state.studyPlan.isLoading
export const selectStudyPlanError = (state: RootState) => state.studyPlan.error
