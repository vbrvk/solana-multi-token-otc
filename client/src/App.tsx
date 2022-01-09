import { Layout } from 'antd'
import React from 'react'
import Exchange from 'features/exchange/Exchange'

import './App.scss'

const { Header, Content } = Layout

function App() {
  return (
    <Layout className={'Layout'}>
      <Header />
      <Content className={'Layout__content'}>
        <Exchange />
      </Content>
    </Layout>
  )
}

export default App
