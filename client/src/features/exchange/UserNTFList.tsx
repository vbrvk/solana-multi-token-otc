import { useSolana } from '@saberhq/use-solana'
import { Card, List } from 'antd'
import { useAppDispatch, useAppSelector } from 'app/hooks'
import { exchangeUserNftsSelector, getUserNFT } from 'features/exchange/exchangeSlice'
import React, { useEffect } from 'react'

import './UserNTFList.scss'

interface IProps {}

const UserNTFList: React.FC<IProps> = () => {
  const { connected, publicKey } = useSolana()
  const { userNfts, loading } = useAppSelector(exchangeUserNftsSelector)
  const dispatch = useAppDispatch()

  useEffect(() => {
    if (connected) {
      dispatch(getUserNFT(String(publicKey)))
    }
  }, [dispatch, connected, publicKey])

  return (
    <List
      loading={loading}
      grid={{ gutter: 10, column: 4 }}
      dataSource={userNfts}
      renderItem={nft => (
        <List.Item>
          <Card
            hoverable
            key={nft.mint}
            cover={<img src={nft.meta?.image} />}
          >
            <Card.Meta title={nft.meta?.symbol} description={nft.mint} />
          </Card>
        </List.Item>
      )}
    />
  )
}

export default UserNTFList

