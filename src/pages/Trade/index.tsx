import React, { useState, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, Radio, InputNumber, message, Checkbox, Divider, Table, Space } from 'antd';
import { listAccountInfo, batchTrade, listOrderInfo, cancelOrder, queryStockPosition } from '@/services/ant-design-pro/api';
import { FormattedMessage, useIntl } from '@umijs/max';
import { getLocale } from '@umijs/max';

interface TradeFormData {
  code: string;
  qty: number;
  orderType: 'market' | 'limit';
  price?: number;
  autoSell?: boolean;
  sellTriggerType?: 'percentage' | 'amount' | 'limit';
  sellTriggerValue?: number;
  timeForce?: boolean;
}

const Trade: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<API.AccountInfo[]>([]);
  const [tradeModalVisible, setTradeModalVisible] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [positionModalVisible, setPositionModalVisible] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<string>();
  const [positionData, setPositionData] = useState<API.PositionObj[]>([]);
  const [positionLoading, setPositionLoading] = useState(false);
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();

  // 获取当前语言环境
  const currentLocale = getLocale();
  const intl = useIntl();

  // 根据当前语言环境选择货币符号
  const getCurrencySymbol = () => {
    return currentLocale === 'zh-CN' ? '¥' : '$';
  };

  // 根据当前语言环境选择金额格式
  const getMoneyLocale = () => {
    return currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US';
  };

  const columns: ProColumns<API.AccountInfo>[] = [
    {
      title: <FormattedMessage id="pages.trade.account.id" defaultMessage="Account ID" />,
      dataIndex: 'account',
      width: 140,
      fixed: 'left',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.trade.account.name" defaultMessage="Account Name" />,
      dataIndex: 'name',
      width: 140,
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.trade.account.availableAmount" defaultMessage="Available Funds" />,
      dataIndex: 'availableAmount',
      width: 150,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.trade.account.totalAmount" defaultMessage="Total Funds" />,
      dataIndex: 'totalAmount',
      width: 150,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.marketValue" defaultMessage="Market Value" />,
      dataIndex: 'marketVal',
      width: 150,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.maxBuyingPower" defaultMessage="Max Buying Power" />,
      dataIndex: 'power',
      width: 150,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.riskLevel" defaultMessage="Risk Level" />,
      dataIndex: 'riskLevel',
      width: 120,
      hideInSearch: true,
      valueEnum: {
        '-1': { text: <FormattedMessage id="pages.trade.risk.unknown" defaultMessage="Unknown" />, status: 'Default' },
        '0': { text: <FormattedMessage id="pages.trade.risk.safe" defaultMessage="Safe" />, status: 'Success' },
        '1': { text: <FormattedMessage id="pages.trade.risk.warning" defaultMessage="Warning" />, status: 'Warning' },
        '2': { text: <FormattedMessage id="pages.trade.risk.danger" defaultMessage="Danger" />, status: 'Error' },
        '3': { text: <FormattedMessage id="pages.trade.risk.absolutelySafe" defaultMessage="Absolutely Safe" />, status: 'Success' },
        '4': { text: <FormattedMessage id="pages.trade.risk.danger" defaultMessage="Danger" />, status: 'Error' },
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.titleOption" defaultMessage="Option" />,
      dataIndex: 'option',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      hideInSearch: true,
      render: (_, record) => [
        <Button
          key="position"
          type="link"
          onClick={() => handleViewPosition(record.account)}
        >
          <FormattedMessage id="pages.trade.viewPosition" defaultMessage="View Position" />
        </Button>
      ],
    },
  ];

  const orderColumns: ProColumns[] = [
    {
      title: <FormattedMessage id="pages.searchTable.accountName" defaultMessage="Account Name" />,
      dataIndex: 'accountName',
      valueType: 'textarea',
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.code" defaultMessage="Stock Code" />,
      dataIndex: 'code',
      valueType: 'textarea',
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.systemType" defaultMessage="Order Source" />,
      dataIndex: 'systemType',
      valueType: 'textarea',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.trdSide" defaultMessage="Buy Direction" />,
      dataIndex: 'trdSide',
      valueType: 'textarea',
      hideInSearch: true,
      valueEnum: {
        1: { text: <FormattedMessage id="pages.trade.action.buy" defaultMessage="Buy" />, status: 'Success' },
        2: { text: <FormattedMessage id="pages.trade.action.sell" defaultMessage="Sell" />, status: 'Error' },
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.orderType" defaultMessage="Order Type" />,
      dataIndex: 'orderType',
      valueType: 'textarea',
      hideInSearch: true,
      valueEnum: {
        1: { text: <FormattedMessage id="pages.trade.orderType.limit" defaultMessage="Limit Order" /> },
        2: { text: <FormattedMessage id="pages.trade.orderType.market" defaultMessage="Market Order" /> },
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.number" defaultMessage="Order Quantity" />,
      dataIndex: 'number',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.price" defaultMessage="Stock Price" />,
      dataIndex: 'price',
      width: 100,
      render: (_, record) => {
        return record.orderType === 2 ? 
          <FormattedMessage id="pages.order.marketPrice" defaultMessage="Market Price" /> : 
          record.price;
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.amount" defaultMessage="Order Amount" />,
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        return record.orderType === 2 ? 
          <FormattedMessage id="pages.order.marketPrice" defaultMessage="Market Price" /> : 
          record.amount;
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.fillQty" defaultMessage="Fill Quantity" />,
      dataIndex: 'fillQty',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.fillAvgPrice" defaultMessage="Average Fill Price" />,
      dataIndex: 'fillAvgPrice',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.createTime" defaultMessage="Creation Time" />,
      dataIndex: 'createTime',
      valueType: 'textarea',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.status" defaultMessage="Status" />,
      dataIndex: 'status',
      hideInSearch: true,
      sorter: true,
      valueEnum: {
        0: { text: <FormattedMessage id="pages.trade.status.notSubmitted" defaultMessage="Not Submitted" />, status: 'Default' },
        1: { text: <FormattedMessage id="pages.trade.status.pending" defaultMessage="Pending" />, status: 'Processing' },
        2: { text: <FormattedMessage id="pages.trade.status.partiallyFilled" defaultMessage="Partially Filled" />, status: 'Processing' },
        3: { text: <FormattedMessage id="pages.trade.status.filled" defaultMessage="Filled" />, status: 'Success' },
        4: { text: <FormattedMessage id="pages.trade.status.invalid" defaultMessage="Invalid" />, status: 'Error' },
        5: { text: <FormattedMessage id="pages.trade.status.canceled" defaultMessage="Canceled" />, status: 'Warning' },
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.titleOption" defaultMessage="Option" />,
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => {
        // 检查状态值是否不在1到10之间
        const statusValue = Number(record.statusValue);
        const canCancel = statusValue >= 1 && statusValue <= 10;
        
        return canCancel ? [
          <Button 
            key="cancel" 
            type="primary" 
            danger
            onClick={() => handleCancelOrder(record.orderNo)}
          >
            <FormattedMessage id="pages.order.cancel" defaultMessage="Cancel" />
          </Button>
        ] : null;
      },
    },
  ];

  // 处理撤单操作
  const handleCancelOrder = async (orderNo: string) => {
    const intl = useIntl();
    
    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.trade.confirmCancel.title', defaultMessage: 'Confirm Cancellation' }),
      content: intl.formatMessage(
        { id: 'pages.trade.confirmCancel.content', defaultMessage: 'Are you sure you want to cancel order {orderNo}?' },
        { orderNo }
      ),
      onOk: async () => {
        try {
          const response = await cancelOrder({
            orderNo
          });
          
          if (response.data === true) {
            message.success(intl.formatMessage({ id: 'pages.trade.cancelSuccess', defaultMessage: 'Order canceled successfully' }));
            // 刷新表格数据
            actionRef.current?.reload();
          } else {
            const errorMsg = response?.errorMessage || response?.message || 
              intl.formatMessage({ id: 'pages.trade.cancelFailed', defaultMessage: 'Failed to cancel order' });
            message.error(errorMsg);
          }
        } catch (error) {
          message.error(intl.formatMessage({ id: 'pages.trade.cancelRequestFailed', defaultMessage: 'Cancel request failed' }));
          console.error('撤单错误:', error);
        }
      },
    });
  };
  

  const handleTrade = (type: 'buy' | 'sell') => {
    if (selectedRows.length === 0) {
      message.warning('请选择交易牛牛号');
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
        orderType: values.orderType === 'market' ? 2 : 1,
        trdSide: tradeType === 'buy' ? 1 : 2,
        price: values.orderType === 'limit' ? values.price : undefined,
        sellTriggerType: values.autoSell && values.sellTriggerType ? values.sellTriggerType : undefined,
        sellTriggerValue: values.autoSell && values.sellTriggerValue ? values.sellTriggerValue : undefined,
        timeForce: values.timeForce ? 1 : 0,
      });
      
      if (response.data) {
        message.success('交易指令已发送');
        setTradeModalVisible(false);
        form.resetFields();
      } else {
        message.error('交易失败');
      }
      // 无论成功失败都延迟刷新订单列表
      setTimeout(() => {
        if (actionRef.current) {
          actionRef.current.reload();
        }
      }, 200);
    } catch (error) {
      message.error('交易失败');
      // 发生错误时也刷新订单列表
      setTimeout(() => {
        if (actionRef.current) {
          actionRef.current.reload();
        }
      }, 200);
    }
  };

  // 查看持仓
  const handleViewPosition = async (account: string) => {
    setCurrentAccount(account);
    setPositionModalVisible(true);
    setPositionLoading(true);
    try {
      const response = await queryStockPosition({ account });
      if (response.data) {
        setPositionData(response.data);
      } else {
        message.error('获取持仓数据失败');
      }
    } catch (error) {
      message.error('获取持仓数据失败');
    } finally {
      setPositionLoading(false);
    }
  };

  // 从持仓列表发起交易
  const handlePositionTrade = (type: 'buy' | 'sell', code: string) => {
    if (!currentAccount) {
      message.warning('牛牛号信息不存在');
      return;
    }
    setTradeType(type);
    setSelectedRows([{ account: currentAccount } as API.AccountInfo]);
    // setSelectedRowKeys([currentAccount]);
    setTradeModalVisible(true);
    form.setFieldValue('code', code);
  };

  const positionColumns = [
    {
      title: <FormattedMessage id="pages.searchTable.code" defaultMessage="Stock Code" />,
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: <FormattedMessage id="pages.trade.position.direction" defaultMessage="Position Direction" />,
      dataIndex: 'positionSide',
      key: 'positionSide',
      render: (val: number) => {
        const color = val === 0 ? '#52c41a' : '#ff4d4f';
        const text = val === 0 ? 
          intl.formatMessage({ id: 'pages.trade.position.long', defaultMessage: 'Long' }) : 
          intl.formatMessage({ id: 'pages.trade.position.short', defaultMessage: 'Short' });
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: <FormattedMessage id="pages.trade.position.quantity" defaultMessage="Position Quantity" />,
      dataIndex: 'qty',
      key: 'qty',
    },
    {
      title: <FormattedMessage id="pages.trade.position.availableQty" defaultMessage="Available Quantity" />,
      dataIndex: 'canSellQty',
      key: 'canSellQty',
    },
    {
      title: <FormattedMessage id="pages.trade.position.costPrice" defaultMessage="Cost Price" />,
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (val: number) => val?.toFixed(2),
    },
    {
      title: <FormattedMessage id="pages.trade.position.currentPrice" defaultMessage="Current Price" />,
      dataIndex: 'price',
      key: 'price',
      render: (val: number) => val?.toFixed(2),
    },
    {
      title: <FormattedMessage id="pages.trade.position.marketValue" defaultMessage="Market Value" />,
      dataIndex: 'val',
      key: 'val',
      render: (val: number) => val?.toFixed(2),
    },
    {
      title: <FormattedMessage id="pages.trade.position.plRatio" defaultMessage="P/L Ratio" />,
      dataIndex: 'plRatio',
      key: 'plRatio',
      render: (val: number) => {
        const color = val >= 0 ? '#52c41a' : '#ff4d4f';
        return <span style={{ color }}>{(val * 100).toFixed(2)}%</span>;
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.titleOption" defaultMessage="Option" />,
      key: 'action',
      render: (_: unknown, record: API.PositionObj) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handlePositionTrade('buy', record.code)}
          >
            <FormattedMessage id="pages.trade.action.buy" defaultMessage="Buy" />
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            onClick={() => handlePositionTrade('sell', record.code)}
          >
            <FormattedMessage id="pages.trade.action.sell" defaultMessage="Sell" />
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.AccountInfo>
        headerTitle="账户列表"
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        options={false}
        params={{
          enable: true
        }}
        request={listAccountInfo}
        columns={columns}
        pagination={{
          defaultPageSize: 100,
          showSizeChanger: true,
          pageSizeOptions: ['100', '200', '500'],
        }}
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

      <Divider style={{ margin: '5px 0' }} />

      <ProTable
        headerTitle="订单列表"
        actionRef={actionRef}
        rowKey="orderNo"
        search={{
          labelWidth: 120,
        }}
        request={listOrderInfo}
        columns={orderColumns}
        options={{
          reload: true,
        }}
        revalidateOnFocus={true}
      />

      <Modal
        title={intl.formatMessage(
          { id: 'pages.trade.form.title', defaultMessage: '{type} Order' },
          { type: tradeType === 'buy' ? 
              intl.formatMessage({ id: 'pages.trade.action.buy', defaultMessage: 'Buy' }) : 
              intl.formatMessage({ id: 'pages.trade.action.sell', defaultMessage: 'Sell' }) 
          }
        )}
        open={tradeModalVisible}
        onCancel={() => {
          setTradeModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        zIndex={1001}
      >
        {!currentAccount && (
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
        )}
        <Form
          form={form}
          onFinish={handleTradeSubmit}
          layout="vertical"
        >
          <Form.Item
            name="code"
            label={intl.formatMessage({ id: 'pages.trade.form.stockCode', defaultMessage: 'Stock Code' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.trade.form.stockCodeRequired', defaultMessage: 'Please input stock code' }) }]}
          >
            <Input 
              placeholder={intl.formatMessage({ id: 'pages.trade.form.stockCodePlaceholder', defaultMessage: 'Please input stock code' })}
              disabled={!!currentAccount}  // 从持仓进入时禁用输入
            />
          </Form.Item>

          <Form.Item
            name="qty"
            label={intl.formatMessage({ id: 'pages.trade.form.quantity', defaultMessage: 'Quantity' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.trade.form.quantityRequired', defaultMessage: 'Please input quantity' }) }]}
          >
            <InputNumber
              min={1}
              placeholder={intl.formatMessage({ id: 'pages.trade.form.quantityPlaceholder', defaultMessage: 'Please input quantity' })}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="orderType"
            label={intl.formatMessage({ id: 'pages.trade.form.orderType', defaultMessage: 'Order Type' })}
            initialValue="market"
          >
            <Radio.Group>
              <Radio value="market">{intl.formatMessage({ id: 'pages.trade.orderType.market', defaultMessage: 'Market Order' })}</Radio>
              <Radio value="limit">{intl.formatMessage({ id: 'pages.trade.orderType.limit', defaultMessage: 'Limit Order' })}</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="timeForce"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>{intl.formatMessage({ id: 'pages.trade.form.timeForce', defaultMessage: 'Time In Force' })}</Checkbox>
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
                <Checkbox>全部成交后自动挂卖单</Checkbox>
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
                        label="卖单规则"
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
                              label={triggerType === 'percentage' ? '上涨幅度(%)' : '上涨金额($)'}
                              initialValue={triggerType === 'percentage' ? 0.5 : 0.5}
                              rules={[{ required: true, message: '请输入触发值' }]}
                            >
                              <InputNumber
                                min={0}
                                step={triggerType === 'percentage' ? 0.1 : 0.1}
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
              {intl.formatMessage(
                { id: 'pages.trade.form.submit', defaultMessage: 'Confirm {type}' },
                { 
                  type: tradeType === 'buy' ? 
                    intl.formatMessage({ id: 'pages.trade.action.buy', defaultMessage: 'Buy' }) : 
                    intl.formatMessage({ id: 'pages.trade.action.sell', defaultMessage: 'Sell' }) 
                }
              )}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={intl.formatMessage(
          { id: 'pages.trade.position.title', defaultMessage: 'Position Information of {account}' },
          { account: currentAccount }
        )}
        open={positionModalVisible}
        onCancel={() => {
          setPositionModalVisible(false);
          setPositionData([]);  // 清空持仓数据
          setCurrentAccount(undefined);
        }}
        footer={null}
        width={1000}
        zIndex={1000}
      >
        <Table
          columns={positionColumns}
          dataSource={positionData}
          rowKey="code"
          loading={positionLoading}
          pagination={false}
          locale={{
            emptyText: intl.formatMessage({ id: 'pages.trade.position.empty', defaultMessage: 'No position data' })
          }}
        />
      </Modal>
    </PageContainer>
  );
};

export default Trade; 