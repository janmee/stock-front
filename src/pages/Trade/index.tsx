import React, { useState, useRef, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { Button, Modal, Form, Input, Radio, InputNumber, message, Checkbox, Divider, Table, Space, DatePicker, Tabs, Select, Switch } from 'antd';
import { listAccountInfo, batchTrade, listOrderInfo, cancelOrder, cancelAllPendingOrders, cancelAllPendingSellOrders, queryStockPosition, createScheduledOrder, batchCreateScheduledOrders, getTimezones } from '@/services/ant-design-pro/api';
import { FormattedMessage, useIntl } from '@umijs/max';
import { getLocale } from '@umijs/max';
import moment from 'moment';
import { request } from 'umi';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

interface TradeFormData {
  code: string;
  qty: number;
  orderType: 'market' | 'limit';
  price?: number;
  autoSell?: boolean;
  sellTriggerType?: 'percentage' | 'amount' | 'limit';
  sellTriggerValue?: number;
  timeForce?: boolean;
  isScheduled?: boolean;
  scheduledTime?: moment.Moment;
  timezone?: string;
  quantityType?: 'fixed' | 'percentage';
  fundPercentage?: number;
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
  const [cancelAllLoading, setCancelAllLoading] = useState(false);
  const [cancelAllSellLoading, setCancelAllSellLoading] = useState(false);
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [scheduledTime, setScheduledTime] = useState<moment.Moment | null>(null);
  const [timezone, setTimezone] = useState<string>('Asia/Shanghai');
  const [timezones] = useState<string[]>(['America/New_York', 'Asia/Shanghai']);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState<boolean>(false);

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
      render: (_, record) => {
        return showSensitiveInfo ? record.account : '****';
      },
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
      render: (_, record) => {
        return showSensitiveInfo ? `$${record.availableAmount?.toFixed(2) || '0.00'}` : '****';
      },
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
      render: (_, record) => {
        return showSensitiveInfo ? `$${record.totalAmount?.toFixed(2) || '0.00'}` : '****';
      },
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
      render: (_, record) => {
        return showSensitiveInfo ? `$${record.marketVal?.toFixed(2) || '0.00'}` : '****';
      },
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
      render: (_, record) => {
        return showSensitiveInfo ? `$${record.power?.toFixed(2) || '0.00'}` : '****';
      },
    },
    {
      title: <FormattedMessage id="pages.trade.account.cashAmount" defaultMessage="Cash Amount" />,
      dataIndex: 'cashAmount',
      width: 150,
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      render: (_, record) => {
        if (!showSensitiveInfo) return '****';
        const cashAmount = (record.totalAmount || 0) - (record.marketVal || 0);
        return `$${cashAmount.toFixed(2)}`;
      },
    },
    {
      title: <FormattedMessage id="pages.trade.account.stockRatio" defaultMessage="Stock Ratio" />,
      dataIndex: 'stockRatio',
      width: 120,
      hideInSearch: true,
      render: (_, record) => {
        if (!showSensitiveInfo) return '****';
        const totalAmount = record.totalAmount || 0;
        const marketVal = record.marketVal || 0;
        const stockRatio = totalAmount > 0 ? (marketVal / totalAmount) * 100 : 0;
        const color = stockRatio > 80 ? '#ff4d4f' : stockRatio > 60 ? '#faad14' : '#52c41a';
        return <span style={{ color }}>{stockRatio.toFixed(2)}%</span>;
      },
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
      render: (val, record) => {
        if (record.orderType === '市价单') {
          return <span style={{ color: '#1890ff', fontStyle: 'italic' }}>
            <FormattedMessage id="pages.order.marketPrice" defaultMessage="Market Price" />
          </span>;
        }
        // 数值格式化显示
        if (val && !isNaN(Number(val))) {
          return `$${Number(val).toFixed(2)}`;
        }
        return val;
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.amount" defaultMessage="Order Amount" />,
      dataIndex: 'amount',
      width: 120,
      hideInSearch: true,
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
      title: <FormattedMessage id="pages.searchTable.updateTime" defaultMessage="Update Time" />,
      dataIndex: 'updateTime',
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
    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.trade.confirmCancel.title', defaultMessage: 'Confirm Cancellation' }),
      content: intl.formatMessage(
        { id: 'pages.trade.confirmCancel.content', defaultMessage: 'Are you sure you want to cancel order {orderNo}?' },
        { orderNo }
      ),
      onOk: async () => {
        // 立即显示请求已发送的提示
        const hideLoading = message.loading({
          content: '撤销请求已发送，请稍候...',
          duration: 0, // 不自动关闭
        });
        
        try {
          const response = await cancelOrder({
            orderNo
          });
          
          // 关闭loading提示
          hideLoading();
          
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
          // 关闭loading提示
          hideLoading();
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
      if (selectedRows.length === 0) {
        message.warning(intl.formatMessage({ 
          id: 'pages.trade.selectAccount', 
          defaultMessage: 'Please select at least one account' 
        }));
        return;
      }
      
      // 日志打印表单值
      console.log('表单值:', JSON.stringify(values, null, 2));
      console.log('表单scheduledTime值:', values.scheduledTime ? values.scheduledTime.format() : null);
      
      // 逻辑优化：同时检查表单值和状态变量
      const shouldCreateScheduledOrder = (values.isScheduled === true || isScheduled === true) && values.scheduledTime != null;
      
      // 如果是定时交易，则创建定时订单
      if (shouldCreateScheduledOrder && values.scheduledTime) {
        console.log('执行定时下单逻辑');
        try {
          // 确保日期时间格式正确 - 直接使用字符串格式
          const formattedDateTime = values.scheduledTime.format('YYYY-MM-DD HH:mm:ss');
          console.log('格式化后的日期时间:', formattedDateTime);
          
          // 组装请求参数（符合ScheduledOrderVO格式）
          const scheduledOrderParams = {
            code: values.code.toUpperCase(),
            trdSide: tradeType === 'buy' ? 1 : 2,
            orderType: values.orderType === 'market' ? 2 : 1,
            price: values.orderType === 'limit' ? Number(values.price) : null, // 确保是数字类型
            number: Number(values.qty),  // 确保数量是数字类型
            scheduledTime: formattedDateTime, // 使用格式化后的字符串
            timezone: values.timezone || 'Asia/Shanghai',
            accountList: selectedRows.map(row => row.account), // 将账号列表添加到请求体中
            accountAliases: selectedRows.length > 1 ? `批量下单(${selectedRows.length}个账号)` : selectedRows[0].name,
            // 添加BatchTradeRequest相关参数
            timeForce: values.timeForce ? 1 : 0,
            sellTriggerType: values.autoSell && values.sellTriggerType ? values.sellTriggerType : undefined,
            sellTriggerValue: values.autoSell && values.sellTriggerValue ? Number(values.sellTriggerValue) : undefined // 确保是数字类型
          };
          
          // 打印完整的请求参数，方便调试
          console.log('定时下单请求参数:', JSON.stringify(scheduledOrderParams, null, 2));
          
          // 使用batchCreateScheduledOrders API
          const response = await batchCreateScheduledOrders(scheduledOrderParams);
          
          console.log('定时下单API响应:', response);
          
          if (response && response.success) {
            message.success(intl.formatMessage({ 
              id: 'pages.trade.scheduledOrder.createSuccess', 
              defaultMessage: 'Scheduled order created successfully' 
            }));
            setTradeModalVisible(false);
            form.resetFields();
          } else {
            // 处理API返回的错误信息
            const errorMsg = response?.errorMessage || response?.message || 
              intl.formatMessage({ id: 'common.unknownError', defaultMessage: 'Unknown error' });
            console.error('API返回错误:', errorMsg);
            message.error(intl.formatMessage(
              { id: 'pages.trade.scheduledOrder.createFailed', defaultMessage: 'Failed to create scheduled order: {error}' },
              { error: errorMsg }
            ));
          }
        } catch (apiError: any) {
          // 捕获API调用过程中的错误
          console.error('API调用异常:', apiError);
          
          // 检查是否是HTTP 400错误
          if (apiError.response && apiError.response.status === 400) {
            console.error('收到400状态码错误，请求参数可能有误:', apiError.response.data);
            message.error(intl.formatMessage(
              { id: 'pages.trade.scheduledOrder.badRequest', defaultMessage: 'Invalid request parameters: {error}' },
              { error: apiError.response.data?.errorMessage || '请检查输入参数' }
            ));
          } else {
            message.error(intl.formatMessage({ 
              id: 'pages.trade.scheduledOrder.networkError', 
              defaultMessage: 'Network error while creating scheduled order' 
            }));
          }
        }
        
        return;
      }
      
      // 普通交易处理
      const response = await batchTrade({
        accounts: selectedRows.map(row => row.account),
        code: values.code,
        number: values.qty,
        orderType: values.orderType === 'market' ? 2 : 1,
        trdSide: tradeType === 'buy' ? 1 : 2,
        price: values.orderType === 'limit' ? values.price : undefined,
        timeForce: values.timeForce ? 1 : 0,
        sellTriggerType: values.autoSell && values.sellTriggerType ? values.sellTriggerType : undefined,
        sellTriggerValue: values.autoSell && values.sellTriggerValue ? values.sellTriggerValue : undefined,
        quantityType: values.quantityType || 'fixed',
        fundPercentage: values.fundPercentage,
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
      render: (val: number) => {
        return showSensitiveInfo ? val : '****';
      },
    },
    {
      title: <FormattedMessage id="pages.trade.position.availableQty" defaultMessage="Available Quantity" />,
      dataIndex: 'canSellQty',
      key: 'canSellQty',
      render: (val: number) => {
        return showSensitiveInfo ? val : '****';
      },
    },
    {
      title: <FormattedMessage id="pages.trade.position.costPrice" defaultMessage="Cost Price" />,
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (val: number) => {
        return showSensitiveInfo ? val?.toFixed(2) : '****';
      },
    },
    {
      title: <FormattedMessage id="pages.trade.position.currentPrice" defaultMessage="Current Price" />,
      dataIndex: 'price',
      key: 'price',
      render: (val: number) => {
        return showSensitiveInfo ? val?.toFixed(2) : '****';
      },
    },
    {
      title: <FormattedMessage id="pages.trade.position.marketValue" defaultMessage="Market Value" />,
      dataIndex: 'val',
      key: 'val',
      render: (val: number) => {
        return showSensitiveInfo ? val?.toFixed(2) : '****';
      },
    },
    {
      title: <FormattedMessage id="pages.trade.position.plRatio" defaultMessage="P/L Ratio" />,
      dataIndex: 'plRatio',
      key: 'plRatio',
      render: (val: number) => {
        if (!showSensitiveInfo) return '****';
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

  // 处理撤销全部订单操作
  const handleCancelAllOrders = async () => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.trade.confirmCancelAll.title', defaultMessage: '确认撤销全部订单' }),
      content: intl.formatMessage({ 
        id: 'pages.trade.confirmCancelAll.content', 
        defaultMessage: '确定要撤销所有状态为"已提交等待成交"的订单吗？此操作不可撤销。' 
      }),
      okText: intl.formatMessage({ id: 'pages.trade.confirm', defaultMessage: '确认' }),
      cancelText: intl.formatMessage({ id: 'pages.trade.cancel', defaultMessage: '取消' }),
      onOk: async () => {
        setCancelAllLoading(true);
        
        // 立即显示请求已发送的提示
        const hideLoading = message.loading({
          content: '请求已发送，撤销单较多时可能需要几分钟重试，请耐心等待...',
          duration: 0, // 不自动关闭
        });
        
        try {
          const response = await cancelAllPendingOrders();
          
          // 关闭loading提示
          hideLoading();
          
          if (response.success && response.data) {
            const { totalCount, successCount, failedCount, failedOrders, message: resultMessage } = response.data;
            
            // 显示详细结果
            Modal.info({
              title: intl.formatMessage({ id: 'pages.trade.cancelAllResult.title', defaultMessage: '撤销结果' }),
              content: (
                <div>
                  <p>{intl.formatMessage({ 
                    id: 'pages.trade.cancelAllResult.total', 
                    defaultMessage: '总订单数：{count}' 
                  }, { count: totalCount })}</p>
                  <p style={{ color: '#52c41a' }}>{intl.formatMessage({ 
                    id: 'pages.trade.cancelAllResult.success', 
                    defaultMessage: '成功撤销：{count}' 
                  }, { count: successCount })}</p>
                  {failedCount > 0 && (
                    <>
                      <p style={{ color: '#ff4d4f' }}>{intl.formatMessage({ 
                        id: 'pages.trade.cancelAllResult.failed', 
                        defaultMessage: '撤销失败：{count}' 
                      }, { count: failedCount })}</p>
                      {failedOrders && failedOrders.length > 0 && (
                        <div>
                          <p>{intl.formatMessage({ 
                            id: 'pages.trade.cancelAllResult.failedOrders', 
                            defaultMessage: '失败订单：' 
                          })}</p>
                          <ul style={{ maxHeight: '100px', overflow: 'auto' }}>
                            {failedOrders.map((orderNo: string) => (
                              <li key={orderNo}>{orderNo}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  {resultMessage && <p style={{ marginTop: '10px', fontStyle: 'italic' }}>{resultMessage}</p>}
                </div>
              ),
              onOk: () => {
                // 刷新订单列表
                actionRef.current?.reload();
              }
            });
            
            if (successCount > 0) {
              message.success(intl.formatMessage({ 
                id: 'pages.trade.cancelAllSuccess', 
                defaultMessage: '成功撤销 {count} 个订单' 
              }, { count: successCount }));
            }
          } else {
            const errorMsg = response?.errorMessage || response?.message || 
              intl.formatMessage({ id: 'pages.trade.cancelAllFailed', defaultMessage: '撤销全部订单失败' });
            message.error(errorMsg);
          }
        } catch (error) {
          // 关闭loading提示
          hideLoading();
          console.error('撤销全部订单错误:', error);
          message.error(intl.formatMessage({ 
            id: 'pages.trade.cancelAllRequestFailed', 
            defaultMessage: '撤销全部订单请求失败' 
          }));
        } finally {
          setCancelAllLoading(false);
        }
      },
    });
  };

  // 处理撤销全部卖出单操作
  const handleCancelAllSellOrders = async () => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.trade.confirmCancelAllSell.title', defaultMessage: '确认撤销全部卖出单' }),
      content: intl.formatMessage({ 
        id: 'pages.trade.confirmCancelAllSell.content', 
        defaultMessage: '确定要撤销所有状态为"已提交等待成交"的卖出订单吗？此操作不可撤销。' 
      }),
      okText: intl.formatMessage({ id: 'pages.trade.confirm', defaultMessage: '确认' }),
      cancelText: intl.formatMessage({ id: 'pages.trade.cancel', defaultMessage: '取消' }),
      onOk: async () => {
        setCancelAllSellLoading(true);
        
        // 立即显示请求已发送的提示
        const hideLoading = message.loading({
          content: '请求已发送，撤销单较多时可能需要几分钟重试，请耐心等待...',
          duration: 0, // 不自动关闭
        });
        
        try {
          const response = await cancelAllPendingSellOrders();
          
          // 关闭loading提示
          hideLoading();
          
          if (response.success && response.data) {
            const { totalCount, successCount, failedCount, failedOrders, message: resultMessage } = response.data;
            
            // 显示详细结果
            Modal.info({
              title: intl.formatMessage({ id: 'pages.trade.cancelAllSellResult.title', defaultMessage: '撤销卖出单结果' }),
              content: (
                <div>
                  <p>{intl.formatMessage({ 
                    id: 'pages.trade.cancelAllSellResult.total', 
                    defaultMessage: '总卖出单数：{count}' 
                  }, { count: totalCount })}</p>
                  <p style={{ color: '#52c41a' }}>{intl.formatMessage({ 
                    id: 'pages.trade.cancelAllSellResult.success', 
                    defaultMessage: '成功撤销：{count}' 
                  }, { count: successCount })}</p>
                  {failedCount > 0 && (
                    <>
                      <p style={{ color: '#ff4d4f' }}>{intl.formatMessage({ 
                        id: 'pages.trade.cancelAllSellResult.failed', 
                        defaultMessage: '撤销失败：{count}' 
                      }, { count: failedCount })}</p>
                      {failedOrders && failedOrders.length > 0 && (
                        <div>
                          <p>{intl.formatMessage({ 
                            id: 'pages.trade.cancelAllSellResult.failedOrders', 
                            defaultMessage: '失败订单：' 
                          })}</p>
                          <ul style={{ maxHeight: '100px', overflow: 'auto' }}>
                            {failedOrders.map((orderNo: string) => (
                              <li key={orderNo}>{orderNo}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  {resultMessage && <p style={{ marginTop: '10px', fontStyle: 'italic' }}>{resultMessage}</p>}
                </div>
              ),
              onOk: () => {
                // 刷新订单列表
                actionRef.current?.reload();
              }
            });
            
            if (successCount > 0) {
              message.success(intl.formatMessage({ 
                id: 'pages.trade.cancelAllSellSuccess', 
                defaultMessage: '成功撤销 {count} 个卖出单' 
              }, { count: successCount }));
            }
          } else {
            const errorMsg = response?.errorMessage || response?.message || 
              intl.formatMessage({ id: 'pages.trade.cancelAllSellFailed', defaultMessage: '撤销全部卖出单失败' });
            message.error(errorMsg);
          }
        } catch (error) {
          // 关闭loading提示
          hideLoading();
          console.error('撤销全部卖出单错误:', error);
          message.error(intl.formatMessage({ 
            id: 'pages.trade.cancelAllSellRequestFailed', 
            defaultMessage: '撤销全部卖出单请求失败' 
          }));
        } finally {
          setCancelAllSellLoading(false);
        }
      },
    });
  };

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
        request={listAccountInfo as any}
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
            key="toggleSensitive"
            icon={showSensitiveInfo ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
          >
            {showSensitiveInfo ? 
              intl.formatMessage({ id: 'pages.account.hideSensitiveInfo', defaultMessage: 'Hide Sensitive Info' }) : 
              intl.formatMessage({ id: 'pages.account.showSensitiveInfo', defaultMessage: 'Show Sensitive Info' })}
          </Button>,
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
        toolBarRender={() => [
          <Button
            key="cancelAllBuy"
            danger
            loading={cancelAllLoading}
            onClick={handleCancelAllOrders}
            style={{ marginRight: 8 }}
          >
            <FormattedMessage id="pages.trade.cancelAllBuyOrders" defaultMessage="撤销全部买入单" />
          </Button>,
          <Button
            key="cancelAllSell"
            danger
            loading={cancelAllSellLoading}
            onClick={handleCancelAllSellOrders}
            style={{ marginRight: 8 }}
          >
            <FormattedMessage id="pages.trade.cancelAllSellOrders" defaultMessage="撤销全部卖出单" />
          </Button>,
        ]}
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
          <Tabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: '即时下单',
                children: (
                  <Form.Item
                    name="isScheduled"
                    hidden
                    initialValue={false}
                  >
                    <Checkbox />
                  </Form.Item>
                ),
              },
              {
                key: '2',
                label: '定时下单',
                children: (
                  <>
                    <Form.Item
                      name="isScheduled"
                      hidden
                      initialValue={true}
                    >
                      <Checkbox checked={true} />
                    </Form.Item>
                    <Form.Item
                      name="scheduledTime"
                      label="定时执行时间"
                      rules={[{ required: true, message: '请选择定时执行时间' }]}
                    >
                      <DatePicker 
                        showTime 
                        format="YYYY-MM-DD HH:mm:ss" 
                        placeholder="选择执行时间" 
                        style={{ width: '100%' }}
                        onChange={(value) => setScheduledTime(value as any)}
                      />
                    </Form.Item>
                    <Form.Item
                      name="timezone"
                      label="时区"
                      initialValue="Asia/Shanghai"
                      rules={[{ required: true, message: '请选择时区' }]}
                    >
                      <Select 
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="America/New_York">美东时间</Select.Option>
                        <Select.Option value="Asia/Shanghai">北京时间</Select.Option>
                      </Select>
                    </Form.Item>
                  </>
                ),
              },
            ]}
            onChange={(activeKey) => {
              console.log('切换Tab:', activeKey);
              // 当切换标签页时，更新表单中的isScheduled字段
              const isScheduledValue = activeKey === '2';
              console.log('设置isScheduled为:', isScheduledValue);
              
              form.setFieldsValue({
                isScheduled: isScheduledValue
              });
              
              setIsScheduled(isScheduledValue);
              
              // 如果切换到定时下单标签，但未设置日期，则设置默认日期为当前时间+1小时
              if (isScheduledValue && !form.getFieldValue('scheduledTime')) {
                const defaultTime = moment().add(1, 'hours');
                form.setFieldsValue({
                  scheduledTime: defaultTime
                });
                setScheduledTime(defaultTime);
              }
            }}
          />

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

          {tradeType === 'buy' && (
            <Form.Item
              name="quantityType"
              label="数量计算方式"
              initialValue="fixed"
            >
              <Radio.Group>
                <Radio value="fixed">指定数量</Radio>
                <Radio value="percentage">按总资金占比</Radio>
              </Radio.Group>
            </Form.Item>
          )}

          {tradeType === 'sell' && (
            <Form.Item
              name="quantityType"
              hidden
              initialValue="fixed"
            >
              <Input />
            </Form.Item>
          )}

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => 
              prevValues.quantityType !== currentValues.quantityType
            }
          >
            {({ getFieldValue }) => {
              const quantityType = getFieldValue('quantityType');
              const isBuyOrder = tradeType === 'buy';
              
              if (isBuyOrder && quantityType === 'percentage') {
                return (
                  <Form.Item
                    name="fundPercentage"
                    label="资金占比(%)"
                    rules={[{ required: true, message: '请输入资金占比' }]}
                    initialValue={5}
                  >
                    <InputNumber
                      min={0.1}
                      max={100}
                      step={0.1}
                      placeholder="请输入资金占比"
                      style={{ width: '100%' }}
                      addonAfter="%"
                    />
                  </Form.Item>
                );
              }
              
              return (
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
              );
            }}
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
            <Checkbox 
              onChange={(e) => {
                // 如果选中"撤单有效"，则自动取消"自动挂卖单"选项
                if (e.target.checked) {
                  form.setFieldsValue({ autoSell: false });
                }
              }}
            >
              {intl.formatMessage({ id: 'pages.trade.form.timeForce', defaultMessage: 'Time In Force' })}
            </Checkbox>
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
                <Checkbox
                  onChange={(e) => {
                    // 如果选中"自动挂卖单"，则自动取消"撤单有效"选项
                    if (e.target.checked) {
                      form.setFieldsValue({ timeForce: false });
                    }
                  }}
                >
                  全部成交后自动挂卖单（程序自动执行）
                </Checkbox>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.autoSell !== currentValues.autoSell ||
                  prevValues.timeForce !== currentValues.timeForce
                }
              >
                {({ getFieldValue }) => {
                  // 获取当前两个选项的值
                  const autoSell = getFieldValue('autoSell');
                  const timeForce = getFieldValue('timeForce');
                  
                  // 如果选中了"撤单有效"，则禁用"自动挂卖单"相关选项
                  if (timeForce) {
                    return (
                      <div style={{ marginBottom: 16, color: '#ff4d4f' }}>
                        撤单有效选项与自动挂卖单互斥，不能同时选择
                      </div>
                    );
                  }
                  
                  // 显示自动挂卖单的相关选项
                  return autoSell ? (
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
                  ) : null;
                }}
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