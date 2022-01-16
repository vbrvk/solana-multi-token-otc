import { createAsyncThunk, createSlice, SerializedError } from '@reduxjs/toolkit'
import { TokenInfo } from '@solana/spl-token-registry'
import { TRootState } from 'app/store'
import { INFT } from 'models/token'
import { getTokensRequest, getWalletNFTRequest } from './exchangeAPI'

export interface IExchangeState {
  tokens: {
    loading: boolean
    error: SerializedError
    tokens: TokenInfo[]
  }
  userNfts: {
    loading: boolean
    error: SerializedError
    userNfts: INFT[]
  },
}

const initialState: IExchangeState = {
  tokens: {
    tokens: [],
    loading: false,
    error: {},
  },
  userNfts: {
    userNfts: [],
    loading: false,
    error: {},
  },
}

export const getTokens = createAsyncThunk('exchange/getTokens', async () => {
  return getTokensRequest()
})

export const getUserNFT = createAsyncThunk('exchange/getUserNFT', async (wallet: string) => {
  return getWalletNFTRequest(wallet)
})


export const exchangeSlice = createSlice({
  name: 'exchange',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(getTokens.pending, (state) => {
      state.tokens.error = {}
      state.tokens.loading = true
    })
    builder.addCase(getTokens.fulfilled, (state, action) => {
      state.tokens.tokens = action.payload || []
      state.tokens.loading = false
    })

    builder.addCase(getUserNFT.pending, (state) => {
      state.userNfts.error = {}
      state.userNfts.loading = true
    })
    builder.addCase(getUserNFT.fulfilled, (state, action) => {
      state.userNfts.userNfts = action.payload
      state.userNfts.loading = false
    })
  },
})

export const exchangeTokensSelector = (state: TRootState) => state.exchange.tokens
export const exchangeUserNftsSelector = (state: TRootState) => state.exchange.userNfts

export default exchangeSlice.reducer
