import { configureStore } from '@reduxjs/toolkit'
import scorerReducer from '../features/scorer/scorerSlice'
import builderReducer from '../features/builder/builderSlice'
import coinsReducer from '../features/coins/coinsSlice'

export const store = configureStore({
  reducer: {
    scorer: scorerReducer,
    builder: builderReducer,
    coins: coinsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
