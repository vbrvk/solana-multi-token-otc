import { DownOutlined, SearchOutlined } from "@ant-design/icons";
import { TokenInfo } from "@solana/spl-token-registry";
import { Avatar, Button, Input, List, Modal } from "antd";
import { ICurrencyValue } from "features/exchange/Exchange";
import useModal from "hooks/useModal";
import VirtualList from "rc-virtual-list";
import React, { useCallback, useMemo, useState } from "react";

import "./CurrencyInput.scss";

interface IProps {
  tokens: TokenInfo[];
  value: ICurrencyValue;
  onChange: (value: ICurrencyValue) => void;
}

const VIRTUAL_LIST_EL_HEIGHT = 48 + 24;
const VIRTUAL_LIST_HEIGHT = VIRTUAL_LIST_EL_HEIGHT * 6;

const CurrencyInput: React.FC<IProps> = ({ value, onChange, tokens }) => {
  const { isModalVisible, onOpenModal, onDestroyModal } = useModal();
  const [searchValue, setSearchValue] = useState("");

  const tokensOptions = useMemo(() => {
    return tokens.filter((item) => {
      const searchString = `${item.address}${item.symbol}${item.name}`

      return searchString.includes(searchValue)
    });
  }, [tokens, searchValue]);

  const triggerChange = useCallback(
    (changedValue) => {
      onChange({
        ...value,
        ...changedValue,
      });
    },
    [onChange, value]
  );

  const onNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.currentTarget.value || "0";
      const isNumber = /^\d+\.?\d*$/.test(inputValue);

      if (!isNumber) {
        return;
      }

      triggerChange({
        number: inputValue,
      });
    },
    [triggerChange]
  );

  const onCurrencyChange = useCallback(
    (newCurrency) => {
      triggerChange({
        currency: newCurrency,
      });
      onDestroyModal();
    },
    [onDestroyModal, triggerChange]
  );

  const onSearch = useCallback((e) => {
    setSearchValue(e.currentTarget.value);
  }, []);

  return (
    <div className="CurrencyInput">
      <Modal
        className={"CurrencyInput__modal"}
        closable={false}
        visible={isModalVisible}
        onCancel={onDestroyModal}
      >
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder={"Search by token or paste address"}
          value={searchValue}
          onChange={onSearch}
        />
        <List>
          <VirtualList
            data={tokensOptions}
            height={VIRTUAL_LIST_HEIGHT}
            itemHeight={VIRTUAL_LIST_EL_HEIGHT}
            itemKey="address"
          >
            {(item: TokenInfo) => (
              <List.Item key={item.address}>
                <List.Item.Meta
                  avatar={<Avatar src={item.logoURI} />}
                  title={
                    <Button type="link" onClick={() => onCurrencyChange(item)}>
                      {item.name} ({item.symbol})
                    </Button>
                  }
                  description={item.address}
                />
              </List.Item>
            )}
          </VirtualList>
        </List>
      </Modal>

      <Input
        placeholder="0.00"
        className="CurrencyInput__value"
        prefix={(
          <Button
            type={"text"}
            className="CurrencyInput__currency"
            onClick={onOpenModal}
          >
            {value.currency.symbol}
            <DownOutlined className="CurrencyInput__currency--dropdown" />
          </Button>
        )}
        value={value.number}
        onChange={onNumberChange}
      />
    </div>
  );
};

export default CurrencyInput;
