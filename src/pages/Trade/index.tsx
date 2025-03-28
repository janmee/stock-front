import React, { useState, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, Radio, InputNumber, message, Checkbox, Divider, Table, Space } from 'antd';
import { listAccountInfo, batchTrade, listOrderInfo, cancelOrder, queryStockPosition } from '@/services/ant-design-pro/api';

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

  const columns: ProColumns<API.AccountInfo>[] = [
    {
      title: '牛牛号',
      dataIndex: 'account',
      width: 180,
    },
    {
      title: '账户别名',
      dataIndex: 'name',
      width: 180,
    },
    {
      title: '可用资金',
      dataIndex: 'availableAmount',
      width: 180,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: '总资金',
      dataIndex: 'totalAmount',
      width: 180,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: '证券市值',
      dataIndex: 'marketVal',
      width: 180,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: '最大购买力',
      dataIndex: 'power',
      width: 180,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      width: 120,
      hideInSearch: true,
      valueEnum: {
        '-1': { text: '未知', status: 'Default' },
        '0': { text: '安全', status: 'Success' },
        '1': { text: '预警', status: 'Warning' },
        '2': { text: '危险', status: 'Error' },
        '3': { text: '绝对安全', status: 'Success' },
        '4': { text: '危险', status: 'Error' },
      },
    },
    {
      title: '操作',
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
          查看持仓
        </Button>
      ],
    },
  ];

  const orderColumns: ProColumns[] = [
    {
      title: '牛牛号',
      dataIndex: 'account',
      valueType: 'textarea',
      sorter: true,
    },
    {
      title: '股票代码',
      dataIndex: 'code',
      valueType: 'textarea',
      sorter: true,
    },
    {
      title: '买入方向',
      dataIndex: 'trdSide',
      valueType: 'textarea',
      hideInSearch: true,
      valueEnum: {
        1: { text: '买入', status: 'Success' },
        2: { text: '卖出', status: 'Error' },
      },
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      valueType: 'textarea',
      hideInSearch: true,
      valueEnum: {
        1: { text: '限价单' },
        2: { text: '市价单' },
      },
    },
    {
      title: '订单数量',
      dataIndex: 'number',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: '股票单价',
      dataIndex: 'price',
      width: 100,
      render: (_, record) => {
        return record.orderType === 2 ? '市价' : record.price;
      },
      hideInSearch: true,
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        return record.orderType === 2 ? '市价' : record.amount;
      },
    },
    {
      title: '成交数量',
      dataIndex: 'fillQty',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: '成交均价',
      dataIndex: 'fillAvgPrice',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'textarea',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      hideInSearch: true,
      sorter: true,
      valueEnum: {
        0: { text: '未提交', status: 'Default' },
        1: { text: '待执行', status: 'Processing' },
        2: { text: '部分成交', status: 'Processing' },
        3: { text: '全部成交', status: 'Success' },
        4: { text: '已失效', status: 'Error' },
        5: { text: '已撤单', status: 'Warning' },
      },
    },
    {
      title: '操作',
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
            撤单
          </Button>
        ] : null;
      },
    },
  ];

  // 处理撤单操作
  const handleCancelOrder = async (orderNo: string) => {
    Modal.confirm({
      title: '确认撤单',
      content: `确定要撤销订单 ${orderNo} 吗？`,
      onOk: async () => {
        try {
          const response = await cancelOrder({
            orderNo
          });
          
          if (response.data === true) {
            message.success('撤单成功');
            // 刷新表格数据
            actionRef.current?.reload();
          } else {
            const errorMsg = response?.errorMessage || response?.message || '撤单失败';
            message.error(errorMsg);
          }
        } catch (error) {
          message.error('撤单请求失败');
          console.error('撤单错误:', error);
        }
      }
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
      title: '股票代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '持仓方向',
      dataIndex: 'positionSide',
      key: 'positionSide',
      render: (val: number) => {
        const color = val === 0 ? '#52c41a' : '#ff4d4f';
        const text = val === 0 ? '多仓' : '空仓';
        return <span style={{ color }}>{text}</span>;
      },
    },
    {
      title: '持仓数量',
      dataIndex: 'qty',
      key: 'qty',
    },
    {
      title: '可用数量',
      dataIndex: 'canSellQty',
      key: 'canSellQty',
    },
    {
      title: '成本价',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (val: number) => val?.toFixed(2),
    },
    {
      title: '当前价',
      dataIndex: 'price',
      key: 'price',
      render: (val: number) => val?.toFixed(2),
    },
    {
      title: '持仓市值',
      dataIndex: 'val',
      key: 'val',
      render: (val: number) => val?.toFixed(2),
    },
    {
      title: '盈亏比例',
      dataIndex: 'plRatio',
      key: 'plRatio',
      render: (val: number) => {
        const color = val >= 0 ? '#52c41a' : '#ff4d4f';
        return <span style={{ color }}>{(val * 100).toFixed(2)}%</span>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: API.PositionObj) => (
        <Space>
          <Button
            type="primary"
            size="small"
            onClick={() => handlePositionTrade('buy', record.code)}
          >
            买入
          </Button>
          <Button
            type="primary"
            danger
            size="small"
            onClick={() => handlePositionTrade('sell', record.code)}
          >
            卖出
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
          pageSizeOptions: ['10', '20', '50', '100'],
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
        title={`${tradeType === 'buy' ? '买入' : '卖出'}交易`}
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
            label="股票代码"
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input 
              placeholder="请输入股票代码" 
              disabled={!!currentAccount}  // 从持仓进入时禁用输入
            />
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
            name="timeForce"
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>撤单有效</Checkbox>
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
              确认{tradeType === 'buy' ? '买入' : '卖出'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`牛牛号${currentAccount}持仓信息`}
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
        />
      </Modal>
    </PageContainer>
  );
};

export default Trade; 