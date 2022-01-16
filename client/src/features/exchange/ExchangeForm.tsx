import { SwapOutlined } from '@ant-design/icons'
import { Button, Form, Row } from 'antd'
import CurrencyFieldArray from 'features/exchange/CurrencyFieldArray'
import { IExchangeForm } from 'features/exchange/Exchange'
import UserNTFList from 'features/exchange/UserNTFList'
import React, { useCallback } from 'react'
import { useForm } from 'react-hook-form'

import './ExchangeForm.scss'

interface IProps {
  onSubmit: (data: IExchangeForm) => Promise<unknown>
  initialValues: IExchangeForm
}

const ExchangeForm: React.FC<IProps> = ({ initialValues, onSubmit }) => {
  const { handleSubmit, control, getValues, setValue } = useForm<IExchangeForm>({
    defaultValues: initialValues,
  })

  const handleSwitchValues = useCallback(() => {
    const { send, receive } = getValues()

    setValue('send', receive)
    setValue('receive', send)
  }, [getValues, setValue])

  return (
    <Form className="ExchangeForm" layout="vertical" onFinish={handleSubmit(onSubmit)}>
      <div className="ExchangeForm__form">
        <CurrencyFieldArray name="send" title="You'll send" control={control} />

        <Button
          className={'ExchangeForm__switch-button'}
          icon={<SwapOutlined />}
          size="large"
          onClick={handleSwitchValues}
        />

        <CurrencyFieldArray name="receive" title="You'll receive" control={control} />
      </div>

      <div>
        <UserNTFList />
      </div>

      <Row justify="center">
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Create
          </Button>
        </Form.Item>
      </Row>
    </Form>
  )
}

export default ExchangeForm
