import { TokenInfo } from '@solana/spl-token-registry'
import { Input, Row, Select } from 'antd'
import { ICurrencyValue } from 'features/exchange/Exchange'
import React, { useCallback, useMemo } from 'react'

import './CurrencyInput.scss'

interface IProps {
  tokens: TokenInfo[]
  value: ICurrencyValue
  onChange: (value: ICurrencyValue) => void
}

const CurrencyInput: React.FC<IProps> = ({ value = {}, onChange, tokens }) => {
  const tokensOptions = useMemo(() => {
    return tokens.map((t) => {
      return (
        <Select.Option key={t.address} value={t.address} label={t.symbol}>
          <Row>
            <img src={t.logoURI} className={'CurrencyInput__currency--logo'} alt={t.name} />
            {t.name}
          </Row>
        </Select.Option>
      )
    })
  }, [tokens])

  const triggerChange = useCallback(
    (changedValue) => {
      onChange({
        ...value,
        ...changedValue,
      })
    },
    [onChange, value],
  )

  const onNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.currentTarget.value || '0'
      const isNumber = /^\d+\.?\d*$/.test(inputValue)

      if (!isNumber) {
        return
      }

      triggerChange({
        number: inputValue,
      })
    },
    [triggerChange],
  )

  const onCurrencyChange = useCallback(
    (newCurrency) => {
      triggerChange({
        currency: newCurrency,
      })
    },
    [triggerChange],
  )

  return (
    <div className="CurrencyInput">
      <Select
        bordered={false}
        className="CurrencyInput__currency"
        value={value.currency}
        onChange={onCurrencyChange}
        optionLabelProp="label"
      >
        {tokensOptions}
      </Select>
      <Input placeholder="0.00" className="CurrencyInput__value" value={value.number} onChange={onNumberChange} />
    </div>
  )
}

export default CurrencyInput
