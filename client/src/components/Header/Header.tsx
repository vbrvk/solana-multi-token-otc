import React from 'react'
import WalletButton from 'components/WalletButton/WalletButton'

import './Header.scss'

interface IProps {}

const Header: React.FC<IProps> = () => {
  return (
    <div className='Header'>
      <div />
      <WalletButton />
    </div>
  )
}

export default Header

