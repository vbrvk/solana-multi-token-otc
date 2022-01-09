import { TokenInfo } from '@solana/spl-token-registry'
import { Alert, Col, Spin, Typography } from 'antd'
import { useAppDispatch, useAppSelector } from 'app/hooks'
import ExchangeForm from 'features/exchange/ExchangeForm'
import { exchangeSelector, getTokens } from 'features/exchange/exchangeSlice'
import React, { useCallback, useEffect, useMemo } from 'react'

import './Exchange.scss'

interface IProps {}

export interface ICurrencyValue {
  currency: TokenInfo
  number: number
}

export interface IExchangeForm {
  send: ICurrencyValue[]
  receive: ICurrencyValue[]
}

const Exchange: React.FC<IProps> = () => {
  const dispatch = useAppDispatch()
  const { tokens, loading } = useAppSelector(exchangeSelector)

  useEffect(() => {
    dispatch(getTokens())
  }, [dispatch])

  const initialValues: IExchangeForm = useMemo(() => {
    return {
      send: [
        {
          number: 10,
          currency: tokens[0],
        },
        {
          number: 10,
          currency: tokens[1],
        },
      ],
      receive: [
        {
          number: 20,
          currency: tokens[2],
        },
      ],
    }
  }, [tokens])

  const handleFormSubmit = useCallback(async (data: IExchangeForm) => {
    console.log(data)
  }, [])

  if (loading) {
    return <Spin />
  }

  if (!tokens.length) {
    return <Alert type="error" message="Error getting tokens" />
  }

  return (
    <div className="Exchange">
      <Col className="Exchange__headings">
        <Typography.Title level={1}>Exchange</Typography.Title>
        <Typography.Title level={2}>Description</Typography.Title>
      </Col>

      <Col>
        <ExchangeForm initialValues={initialValues} onSubmit={handleFormSubmit} />
      </Col>
    </div>
  )
}

export default Exchange
