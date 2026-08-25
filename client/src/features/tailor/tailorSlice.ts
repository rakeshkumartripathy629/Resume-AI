import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api, apiErrorMessage } from '../../lib/api'
import type { TailorResult, TailoredResume } from '../../types/tailor'

interface TailorState {
  resumeText: string
  jobDescription: string
  status: 'idle' | 'tailoring' | 'succeeded' | 'failed'
  result: TailorResult | null
  editedResume: TailoredResume | null
  error: string | null
  coinBalance: number | null
  history: TailorHistoryItem[]
  historyTotal: number
  historyPage: number
  historyPages: number
  historyStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
}

export interface TailorHistoryItem {
  id: string
  jobTitle: string
  company: string
  atsScore: number
  keywordCount: number
  createdAt: string
}

interface TailorResponse {
  success: boolean
  data: TailorResult & { coinBalance: number }
}

interface TailorListResponse {
  success: boolean
  data: {
    items: TailorHistoryItem[]
    pagination: { page: number; limit: number; total: number; pages: number }
  }
}

export const tailorResume = createAsyncThunk(
  'tailor/tailorResume',
  async (payload: { resumeText: string; jobDescription: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<TailorResponse>('/agent/tailor', payload)
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const fetchTailors = createAsyncThunk(
  'tailor/fetchTailors',
  async (payload: { page?: number; limit?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get<TailorListResponse>('/agent/tailors', {
        params: { page: payload.page ?? 1, limit: payload.limit ?? 10 },
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

const initialState: TailorState = {
  resumeText: '',
  jobDescription: '',
  status: 'idle',
  result: null,
  editedResume: null,
  error: null,
  coinBalance: null,
  history: [],
  historyTotal: 0,
  historyPage: 1,
  historyPages: 1,
  historyStatus: 'idle',
}

const tailorSlice = createSlice({
  name: 'tailor',
  initialState,
  reducers: {
    setTailorInputs(state, action: PayloadAction<{ resumeText: string; jobDescription: string }>) {
      state.resumeText = action.payload.resumeText
      state.jobDescription = action.payload.jobDescription
    },
    updateEditedResume(state, action: PayloadAction<TailoredResume>) {
      state.editedResume = action.payload
    },
    resetTailor() {
      return initialState
    },
    backToTailorEditor(state) {
      state.status = 'idle'
      state.result = null
      state.editedResume = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(tailorResume.pending, (state) => {
        state.status = 'tailoring'
        state.error = null
        state.result = null
        state.editedResume = null
      })
      .addCase(tailorResume.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.result = action.payload
        state.editedResume = action.payload.tailoredResume
        state.coinBalance = action.payload.coinBalance
      })
      .addCase(tailorResume.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          (action.payload as string | undefined) ?? action.error.message ?? 'Tailoring failed'
      })
      .addCase(fetchTailors.pending, (state) => {
        state.historyStatus = 'loading'
      })
      .addCase(fetchTailors.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded'
        state.history = action.payload.items
        state.historyTotal = action.payload.pagination.total
        state.historyPage = action.payload.pagination.page
        state.historyPages = action.payload.pagination.pages
      })
      .addCase(fetchTailors.rejected, (state) => {
        state.historyStatus = 'failed'
      })
  },
})

export const { setTailorInputs, updateEditedResume, resetTailor, backToTailorEditor } =
  tailorSlice.actions

export default tailorSlice.reducer
