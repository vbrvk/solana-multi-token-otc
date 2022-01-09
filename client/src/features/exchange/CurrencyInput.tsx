import { Input, Select } from 'antd'
import React, { useCallback, useState } from 'react'

import './CurrencyInput.scss'

interface ICurrencyValue {
  currency: string
  number: number
}

interface IProps {
  value?: ICurrencyValue
  onChange?: (value: ICurrencyValue) => void
}

const CurrencyInput: React.FC<IProps> = ({ value = {}, onChange }) => {
  const [number, setNumber] = useState<string | number>(0)
  const [currency, setCurrency] = useState('rmb')

  const triggerChange = useCallback(
    (changedValue) => {
      onChange?.({
        number,
        currency,
        ...value,
        ...changedValue,
      })
    },
    [currency, number, onChange, value],
  )

  const onNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.currentTarget.value || '0'
      const isNumber = /^\d+\.?\d*$/.test(inputValue)

      if (!isNumber) {
        return
      }

      if (!('number' in value)) {
        setNumber(inputValue)
      }

      triggerChange({
        number: inputValue,
      })
    },
    [triggerChange, value],
  )

  const onCurrencyChange = useCallback(
    (newCurrency) => {
      if (!('currency' in value)) {
        setCurrency(newCurrency)
      }

      triggerChange({
        currency: newCurrency,
      })
    },
    [triggerChange, value],
  )

  return (
    <div className="CurrencyInput">
      <Select className="CurrencyInput__currency" value={value.currency || currency} onChange={onCurrencyChange}>
        <Select.Option value="rmb">RMB</Select.Option>
        <Select.Option value="dollar">Dollar</Select.Option>
      </Select>
      <Input className="CurrencyInput__value" value={value.number || number} onChange={onNumberChange} />
    </div>
  )
}

export default CurrencyInput
