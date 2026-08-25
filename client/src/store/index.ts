import { configureStore } from '@reduxjs/toolkit'
import scorerReducer from '../features/scorer/scorerSlice'

export const store = configureStore({
  reducer: {
    scorer: scorerReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
