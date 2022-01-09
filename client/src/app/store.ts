import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit'
import exchange from 'features/exchange/exchangeSlice'

export const store = configureStore({
  reducer: {
    exchange,
  },
})

export type TAppDispatch = typeof store.dispatch
export type TRootState = ReturnType<typeof store.getState>
export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, TRootState, unknown, Action<string>>
