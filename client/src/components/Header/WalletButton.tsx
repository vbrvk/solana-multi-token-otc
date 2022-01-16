import { useWalletKit } from '@gokiprotocol/walletkit'
import { useSolana } from '@saberhq/use-solana'
import { Button } from 'antd'
import { shortAddress } from 'helpers/utils'
import React, { useState } from 'react'

interface IProps {}

const WalletButton: React.FC<IProps> = () => {
  const { connected, publicKey, disconnect } = useSolana()
  const { connect } = useWalletKit()
  const [isDisconnectHovered, setIsDisconnectHovered] = useState(false)

  return (
    <>
      {connected ? (
        <>
          <Button
            onClick={disconnect}
            onMouseOver={() => setIsDisconnectHovered(true)}
            onMouseLeave={() => setIsDisconnectHovered(false)}
          >
            {isDisconnectHovered ? 'Disconnect' : shortAddress(publicKey?.toString())}
          </Button>
        </>
      ) : (
        <Button type='primary' onClick={() => connect()}>Connect Wallet</Button>
      )}
    </>
  )
}

export default WalletButton
