import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, Radio, InputNumber, message, Checkbox } from 'antd';
import { listAccountInfo, batchTrade } from '@/services/ant-design-pro/api';

interface TradeFormData {
  code: string;
  qty: number;
  orderType: 'market' | 'limit';
  price?: number;
  autoSell?: boolean;
  sellTriggerType?: 'percentage' | 'amount' | 'limit';
  sellTriggerValue?: number;
}

const Trade: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<API.AccountInfo[]>([]);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [form] = Form.useForm();

  const columns: ProColumns<API.AccountInfo>[] = [
    {
      title: '账户',
      dataIndex: 'account',
      width: 120,
    },
    {
      title: '账户别名',
      dataIndex: 'name',
      width: 120,
    },
    {
      title: '可用资金',
      dataIndex: 'availableAmount',
      width: 120,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
    },
    {
      title: '总资金',
      dataIndex: 'totalAmount',
      width: 120,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
    },
    {
      title: '最大购买力',
      dataIndex: 'power',
      width: 120,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
    },
  ];

  const handleTrade = (type: 'buy' | 'sell') => {
    if (selectedRows.length === 0) {
      message.warning('请选择交易账户');
      return;
    }
    setTradeType(type);
    setTradeModalVisible(true);
  };

  const handleTradeSubmit = async (values: TradeFormData) => {
    try {
      const response = await batchTrade({
        accounts: selectedRows.map(row => row.account),
        code: values.code,
        number: values.qty,
        orderType: values.orderType === 'market' ? 2 : 1, // 1-普通订单(限价)  2-市价订单
        trdSide: tradeType === 'buy' ? 1 : 2, // 1-买入, 2-卖出
        price: values.orderType === 'limit' ? values.price : undefined,
        sellTriggerType: values.autoSell && values.sellTriggerType ? values.sellTriggerType : undefined,
        sellTriggerValue: values.autoSell && values.sellTriggerValue ? values.sellTriggerValue : undefined,
      });
      
      if (response.data) {
        message.success('交易指令已发送');
        setTradeModalVisible(false);
        form.resetFields();
      } else {
        message.error('交易失败');
      }
    } catch (error) {
      message.error('交易失败');
    }
  };

  return (
    <PageContainer>
      <ProTable<API.AccountInfo>
        headerTitle="账户列表"
        rowKey="id"
        search={false}
        options={false}
        request={listAccountInfo}
        columns={columns}
        rowSelection={{
          selectedRowKeys,
          onChange: (newSelectedRowKeys, newSelectedRows) => {
            setSelectedRowKeys(newSelectedRowKeys);
            setSelectedRows(newSelectedRows);
          },
        }}
        toolBarRender={() => [
          <Button
            key="buy"
            type="primary"
            onClick={() => handleTrade('buy')}
            disabled={selectedRows.length === 0}
          >
            买入
          </Button>,
          <Button
            key="sell"
            danger
            onClick={() => handleTrade('sell')}
            disabled={selectedRows.length === 0}
          >
            卖出
          </Button>,
        ]}
      />

      <Modal
        title={`${tradeType === 'buy' ? '买入' : '卖出'}交易`}
        open={tradeModalVisible}
        onCancel={() => {
          setTradeModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { code: 'AAPL', name: '苹果' },
            { code: 'NVDA', name: '英伟达' },
            { code: 'META', name: 'Meta' },
            { code: 'MSFT', name: '微软' },
            { code: 'AMZN', name: '亚马逊' },
            { code: 'GOOGL', name: '谷歌' },
            { code: 'TSLA', name: '特斯拉' },
            { code: 'AVGO', name: '博通' },
            { code: 'CRWD', name: 'CrowdStrike' },
            { code: 'TSM', name: '台积电' },
          ].map((stock) => (
            <Button
              key={stock.code}
              size="small"
              onClick={() => form.setFieldValue('code', stock.code)}
            >
              {stock.code}({stock.name})
            </Button>
          ))}
        </div>
        <Form
          form={form}
          onFinish={handleTradeSubmit}
          layout="vertical"
        >
          <Form.Item
            name="code"
            label="股票代码"
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input placeholder="请输入股票代码" />
          </Form.Item>

          <Form.Item
            name="qty"
            label="交易数量"
            rules={[{ required: true, message: '请输入交易数量' }]}
          >
            <InputNumber
              min={1}
              placeholder="请输入交易数量"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="orderType"
            label="订单类型"
            initialValue="market"
          >
            <Radio.Group>
              <Radio value="market">市价单</Radio>
              <Radio value="limit">限价单</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.orderType !== currentValues.orderType
            }
          >
            {({ getFieldValue }) => 
              getFieldValue('orderType') === 'limit' ? (
                <Form.Item
                  name="price"
                  label="价格"
                  rules={[{ required: true, message: '请输入价格' }]}
                >
                  <InputNumber
                    min={0}
                    step={0.01}
                    placeholder="请输入价格"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {tradeType === 'buy' && (
            <>
              <Form.Item
                name="autoSell"
                valuePropName="checked"
                initialValue={true}
              >
                <Checkbox>自动卖出</Checkbox>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.autoSell !== currentValues.autoSell
                }
              >
                {({ getFieldValue }) => 
                  getFieldValue('autoSell') ? (
                    <>
                      <Form.Item
                        name="sellTriggerType"
                        label="卖出触发条件"
                        initialValue="percentage"
                      >
                        <Radio.Group>
                          <Radio value="percentage">按上涨幅度</Radio>
                          <Radio value="amount">按上涨金额</Radio>
                          <Radio value="limit">限价卖出</Radio>
                        </Radio.Group>
                      </Form.Item>

                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.sellTriggerType !== currentValues.sellTriggerType
                        }
                      >
                        {({ getFieldValue }) => {
                          const triggerType = getFieldValue('sellTriggerType');
                          if (triggerType === 'limit') {
                            return (
                              <Form.Item
                                name="sellTriggerValue"
                                label="卖出价格"
                                rules={[{ required: true, message: '请输入卖出价格' }]}
                              >
                                <InputNumber
                                  min={0}
                                  step={0.01}
                                  placeholder="请输入卖出价格"
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            );
                          }
                          return (
                            <Form.Item
                              name="sellTriggerValue"
                              label={triggerType === 'percentage' ? '上涨幅度(%)' : '上涨比例($)'}
                              initialValue={triggerType === 'percentage' ? 1 : 1}
                              rules={[{ required: true, message: '请输入触发值' }]}
                            >
                              <InputNumber
                                min={0}
                                step={triggerType === 'percentage' ? 0.1 : 0.01}
                                placeholder={`请输入${triggerType === 'percentage' ? '上涨幅度' : '上涨比例'}`}
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          );
                        }}
                      </Form.Item>
                    </>
                  ) : null
                }
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              确认{tradeType === 'buy' ? '买入' : '卖出'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default Trade; 