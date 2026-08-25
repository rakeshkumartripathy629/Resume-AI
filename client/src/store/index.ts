import { configureStore } from '@reduxjs/toolkit'
import scorerReducer from '../features/scorer/scorerSlice'
import builderReducer from '../features/builder/builderSlice'

export const store = configureStore({
  reducer: {
    scorer: scorerReducer,
    builder: builderReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
