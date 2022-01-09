import { TokenListProvider } from '@solana/spl-token-registry'
import { message } from 'antd'
import getErrorMessage from '../../helpers/getErrorMessage'

export const getTokensRequest = async () => {
  try {
    const tokenListContainer = await new TokenListProvider().resolve()

    return tokenListContainer.getList()
  } catch (err) {
    message.error(getErrorMessage(err))
  }
}
