import { configureStore } from '@reduxjs/toolkit'
import scorerReducer from '../features/scorer/scorerSlice'
import builderReducer from '../features/builder/builderSlice'
import coinsReducer from '../features/coins/coinsSlice'
import interviewReducer from '../features/interview/interviewSlice'
import interviewListReducer from '../features/interview/interviewListSlice'
import resumeListReducer from '../features/resumes/resumeListSlice'
import roadmapReducer from '../features/roadmap/roadmapSlice'
import billingReducer from '../features/billing/billingSlice'
import tailorReducer from '../features/tailor/tailorSlice'
import adminReducer from '../features/admin/adminSlice'

export const store = configureStore({
  reducer: {
    scorer: scorerReducer,
    builder: builderReducer,
    coins: coinsReducer,
    interview: interviewReducer,
    interviewList: interviewListReducer,
    resumeList: resumeListReducer,
    roadmap: roadmapReducer,
    billing: billingReducer,
    tailor: tailorReducer,
    admin: adminReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
