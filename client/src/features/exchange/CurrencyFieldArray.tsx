import { DeleteOutlined } from '@ant-design/icons'
import { Button, Col, Form, Typography } from 'antd'
import { useAppSelector } from 'app/hooks'
import CurrencyInput from 'features/exchange/CurrencyInput'
import { IExchangeForm } from 'features/exchange/Exchange'
import { exchangeTokensSelector } from 'features/exchange/exchangeSlice'
import React, { useCallback } from 'react'
import { Control, Controller, useFieldArray } from 'react-hook-form'

import './CurrencyFieldArray.scss'

interface IProps {
  control: Control<IExchangeForm>
  name: keyof IExchangeForm
  title: string
}

const CurrencyFieldArray: React.FC<IProps> = ({ name, control, title }) => {
  const { tokens } = useAppSelector(exchangeTokensSelector)

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  })

  const handleAppendClick = useCallback(() => {
    append({
      currency: tokens[0],
    })
  }, [append, tokens])

  return (
    <Col className='CurrencyFieldArray'>
      <Typography.Paragraph>{title}</Typography.Paragraph>
      {fields.map((field, index) => {
        return (
          <Controller
            key={field.id}
            name={`${name}.${index}`}
            control={control}
            render={({ field: currency }) => {
              return (
                <Form.Item className='CurrencyFieldArray__form-item'>
                  <CurrencyInput
                    tokens={tokens}
                    value={currency.value}
                    onChange={currency.onChange}
                  />
                  {fields.length > 1 && (
                    <Button
                      className='CurrencyFieldArray__remove-btn'
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(index)}
                    />
                  )}
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
