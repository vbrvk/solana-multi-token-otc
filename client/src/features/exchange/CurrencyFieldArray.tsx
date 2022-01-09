import { Button, Col, Form, Typography } from 'antd'
import { useAppSelector } from 'app/hooks'
import CurrencyInput from 'features/exchange/CurrencyInput'
import { IExchangeForm } from 'features/exchange/Exchange'
import { exchangeSelector } from 'features/exchange/exchangeSlice'
import React, { useCallback } from 'react'
import { Control, Controller, useFieldArray } from 'react-hook-form'

interface IProps {
  control: Control<IExchangeForm>
  name: keyof IExchangeForm
  title: string
}

const CurrencyFieldArray: React.FC<IProps> = ({ name, control, title }) => {
  const { tokens } = useAppSelector(exchangeSelector)

  const { fields, append } = useFieldArray({
    control,
    name,
  })

  const handleAppendClick = useCallback(() => {
    append({
      currency: tokens[0],
    })
  }, [append, tokens])

  return (
    <Col>
      <Typography.Paragraph>{title}</Typography.Paragraph>
      {fields.map((field, index) => {
        return (
          <Controller
            key={field.id}
            name={`${name}.${index}`}
            control={control}
            render={({ field: currency }) => {
              return (
                <Form.Item>
                  <CurrencyInput tokens={tokens} value={currency.value} onChange={currency.onChange} />
                </Form.Item>
              )
            }}
          />
        )
      })}
      <Button onClick={handleAppendClick}>+ Add a currency</Button>
    </Col>
  )
}

export default CurrencyFieldArray
