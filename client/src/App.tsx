import { WalletKitProvider } from '@gokiprotocol/walletkit'
import { Layout } from 'antd'
import React from 'react'
import Exchange from 'features/exchange/Exchange'
import Header from 'components/Header/Header'

import './App.scss'

function App() {
  return (
    <WalletKitProvider
      app={{
        name: 'Solana exchange',
      }}
    >
      <Layout className={'Layout'}>
        <Layout.Header>
          <Header />
        </Layout.Header>
        <Layout.Content className={'Layout__content'}>
          <Exchange />
        </Layout.Content>
      </Layout>
    </WalletKitProvider>
  )
}

export default App
