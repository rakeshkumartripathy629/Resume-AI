import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { api, apiErrorMessage } from '../../lib/api'

export interface RoadmapResource {
  title: string
  type: 'course' | 'book' | 'docs' | 'project' | 'other'
}

export interface RoadmapPhase {
  title: string
  duration: string
  skills: string[]
  milestones: string[]
  resources: RoadmapResource[]
}

export interface GapAnalysis {
  matchingSkills: string[]
  missingSkills: string[]
  notes: string
}

export interface Roadmap {
  id: string
  targetRole: string
  experienceLevel: 'beginner' | 'intermediate' | 'advanced'
  currentSkills: string[]
  summary: string
  gapAnalysis: GapAnalysis
  phases: RoadmapPhase[]
  createdAt: string
}

export interface RoadmapHistoryItem {
  id: string
  targetRole: string
  experienceLevel: string
  phaseCount: number
  createdAt: string
}

interface RoadmapState {
  current: Roadmap | null
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
  history: RoadmapHistoryItem[]
  historyStatus: 'idle' | 'loading' | 'succeeded' | 'failed'
}

interface RoadmapListResponse {
  success: boolean
  data: { items: RoadmapHistoryItem[] }
}

const initialState: RoadmapState = {
  current: null,
  status: 'idle',
  error: null,
  history: [],
  historyStatus: 'idle',
}

export const generateRoadmap = createAsyncThunk(
  'roadmap/generate',
  async (
    payload: {
      targetRole: string
      experienceLevel: Roadmap['experienceLevel']
      currentSkills: string[]
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post<{ success: boolean; data: Roadmap }>(
        '/roadmaps/generate',
        payload
      )
      return response.data.data
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

export const fetchRoadmaps = createAsyncThunk(
  'roadmap/fetchRoadmaps',
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await api.get<RoadmapListResponse>('/roadmaps/mine')
      return response.data.data.items
    } catch (error) {
      return rejectWithValue(apiErrorMessage(error))
    }
  }
)

const roadmapSlice = createSlice({
  name: 'roadmap',
  initialState,
  reducers: {
    clearRoadmap() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateRoadmap.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(generateRoadmap.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.current = action.payload
      })
      .addCase(generateRoadmap.rejected, (state, action) => {
        state.status = 'failed'
        state.error =
          (action.payload as string | undefined) ??
          action.error.message ??
          'Failed to generate roadmap'
      })
      .addCase(fetchRoadmaps.pending, (state) => {
        state.historyStatus = 'loading'
      })
      .addCase(fetchRoadmaps.fulfilled, (state, action) => {
        state.historyStatus = 'succeeded'
        state.history = action.payload
      })
      .addCase(fetchRoadmaps.rejected, (state) => {
        state.historyStatus = 'failed'
      })
  },
})

export const { clearRoadmap } = roadmapSlice.actions
export default roadmapSlice.reducer
