import { SwapOutlined } from '@ant-design/icons'
import { Button, Col, Form, Row, Typography } from 'antd'
import CurrencyInput from 'features/exchange/CurrencyInput'
import React from 'react'

import './Exchange.scss'

interface IProps {}

export const Exchange: React.FC<IProps> = () => {
  return (
    <Row justify="center" className="Exchange">
      <Col flex={1}>
        <Form layout="vertical">
          <Col>
            <Typography.Title level={1}>Exchange</Typography.Title>
            <Typography.Title level={2}>Description</Typography.Title>
          </Col>

          <Col>
            <Row justify="space-around" align="middle">
              <Form.Item label="You'll send">
                <CurrencyInput />
              </Form.Item>

              <Button icon={<SwapOutlined />} size="large" />

              <Form.Item label="You'll receive">
                <CurrencyInput />
              </Form.Item>
            </Row>
          </Col>

          <Form.Item>
            <Button type="primary" htmlType="submit">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Col>
    </Row>
  )
}
