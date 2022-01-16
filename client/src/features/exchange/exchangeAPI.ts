import { getParsedNftAccountsByOwner } from '@nfteyez/sol-rayz'
import { TokenInfo } from '@saberhq/token-utils'
import { TokenListProvider } from '@solana/spl-token-registry'
import { message } from 'antd'
import { INFT, INFTMeta } from 'models/token'
import getErrorMessage from '../../helpers/getErrorMessage'

export const getTokensRequest = async (): Promise<TokenInfo[]> => {
  try {
    const tokenListContainer = await new TokenListProvider().resolve()

    return tokenListContainer.getList()
  } catch (err) {
    message.error(getErrorMessage(err))
    return []
  }
}

// To test on "devnet" need to change "mainnet-beta" in node_modules/@nfteyez/sol-rayz/dist/utils.js on line:
// if (clusterApi === void 0) { clusterApi = (0, web3_js_1.clusterApiUrl)("mainnet-beta"); }
// to "devnet"
// Returns information about solana NFTS in a given walletAddress.
export const getWalletNFTRequest = async (walletAddress: string): Promise<INFT[]> => {
  try {
    const tokenList: INFT[] = await getParsedNftAccountsByOwner({ publicAddress: walletAddress })

    return Promise.all(tokenList.map(async (token) => {
      if (!token?.data?.uri) {
        return token
      }

      const res = await fetch(token.data.uri)
      const meta: INFTMeta = await res.json()

      return {
        ...token,
        meta,
      }
    }))
  } catch (err) {
    message.error(getErrorMessage(err))
    return []
  }
}