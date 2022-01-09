import { createAsyncThunk, createSlice, SerializedError } from '@reduxjs/toolkit'
import { TokenInfo } from '@solana/spl-token-registry'
import { TRootState } from 'app/store'
import { getTokensRequest } from './exchangeAPI'

export interface IExchangeState {
  tokens: TokenInfo[]
  error: SerializedError
  loading: boolean
}

const initialState: IExchangeState = {
  tokens: [],
  error: {},
  loading: false,
}

export const getTokens = createAsyncThunk('tokens/getTokens', async () => {
  return getTokensRequest()
})

export const exchangeSlice = createSlice({
  name: 'tokens',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    for (const thunk of [getTokens]) {
      builder.addCase(thunk.pending, (state) => {
        state.error = {}
        state.loading = true
      })
      builder.addCase(thunk.rejected, (state, action) => {
        state.error = action.error
        state.loading = false
      })
    }

    builder.addCase(getTokens.fulfilled, (state, action) => {
      state.tokens = action.payload || []
      state.loading = false
    })
  },
})

export const exchangeSelector = (state: TRootState) => state.exchange

export default exchangeSlice.reducer
