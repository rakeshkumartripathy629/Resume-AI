import { configureStore } from '@reduxjs/toolkit'
import scorerReducer from '../features/scorer/scorerSlice'
import builderReducer from '../features/builder/builderSlice'
import coinsReducer from '../features/coins/coinsSlice'
import interviewReducer from '../features/interview/interviewSlice'
import interviewListReducer from '../features/interview/interviewListSlice'

export const store = configureStore({
  reducer: {
    scorer: scorerReducer,
    builder: builderReducer,
    coins: coinsReducer,
    interview: interviewReducer,
    interviewList: interviewListReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
