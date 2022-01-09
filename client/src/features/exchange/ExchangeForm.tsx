import { SwapOutlined } from '@ant-design/icons'
import { Button, Col, Form, Row } from 'antd'
import { useAppSelector } from 'app/hooks'
import CurrencyInput from 'features/exchange/CurrencyInput'
import { IExchangeForm } from 'features/exchange/Exchange'
import { exchangeSelector } from 'features/exchange/exchangeSlice'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'

interface IProps {
  onSubmit: (data: IExchangeForm) => Promise<unknown>
  initialValues: IExchangeForm
}

const ExchangeForm: React.FC<IProps> = ({ initialValues, onSubmit }) => {
  const { tokens } = useAppSelector(exchangeSelector)

  const { handleSubmit, control, getValues, setValue } = useForm({
    defaultValues: initialValues,
  })

  const handleSwitchValues = useCallback(() => {
    const { send, receive } = getValues()

    setValue('send', receive)
    setValue('receive', send)
  }, [getValues, setValue])

  return (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <Col>
        <Row justify="space-around" align="middle">
          <Controller
            name={'send'}
            control={control}
            render={({ field }) => {
              return (
                <Form.Item label="You'll send">
                  <CurrencyInput tokens={tokens} value={field.value} onChange={field.onChange} />
                </Form.Item>
              )
            }}
          />

          <Button icon={<SwapOutlined />} size="large" onClick={handleSwitchValues} />

          <Controller
            name={'receive'}
            control={control}
            render={({ field }) => {
              return (
                <Form.Item label="You'll send">
                  <CurrencyInput tokens={tokens} value={field.value} onChange={field.onChange} />
                </Form.Item>
              )
            }}
          />
        </Row>
      </Col>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Create
        </Button>
      </Form.Item>
    </Form>
  )
}

export default ExchangeForm
