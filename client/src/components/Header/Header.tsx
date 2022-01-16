import { useConnectedWallet, useSolana } from '@saberhq/use-solana'
import React from 'react'
import WalletButton from 'components/Header/WalletButton'

import './Header.scss'

interface IProps {}

const Header: React.FC<IProps> = () => {
  const { walletProviderInfo, disconnect, providerMut, network, setNetwork } =
    useSolana()
  const wallet = useConnectedWallet()

  console.log(walletProviderInfo)

  return (
    <div className='Header'>
      <div />
      <WalletButton />
    </div>
  )
}

export default Header

