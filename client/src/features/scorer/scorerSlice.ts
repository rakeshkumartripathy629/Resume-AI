import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { api, apiErrorMessage } from '../../lib/api'
import type { ScoreResult } from '../../types/scoring'

interface ScorerState {
  resumeText: string
  jobDescription: string
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  result: ScoreResult | null
  error: string | null
}

interface ScoreResponse {
  success: boolean
  data: ScoreResult
}

export const scoreResume = createAsyncThunk(
  'scorer/scoreResume',
  async (payload: { resumeText: string; jobDescription: string }, { rejectWithValue }) => {
    try {
      const response = await api.post<ScoreResponse>('/agent/score', payload)
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

const initialState: ScorerState = {
  resumeText: '',
  jobDescription: '',
  status: 'idle',
  result: null,
  error: null,
}

const scorerSlice = createSlice({
  name: 'scorer',
  initialState,
  reducers: {
    setResumeText(state, action: PayloadAction<string>) {
      state.resumeText = action.payload
    },
    setJobDescription(state, action: PayloadAction<string>) {
      state.jobDescription = action.payload
    },
    resetScorer() {
      return initialState
    },
    backToEditor(state) {
      state.status = 'idle'
      state.result = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(scoreResume.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(scoreResume.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.result = action.payload
      })
      .addCase(scoreResume.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          (action.payload as string | undefined) ?? action.error.message ?? 'Scoring failed'
      })
  },
})

export const { setResumeText, setJobDescription, resetScorer, backToEditor } =
  scorerSlice.actions

export default scorerSlice.reducer
