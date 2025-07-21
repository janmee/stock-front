import React, { useState, useEffect, useRef } from 'react';
import { 
  Card, 
  Input, 
  Button, 
  message, 
  Spin, 
  Space, 
  Statistic, 
  Row, 
  Col, 
  Form,
  Radio,
  Divider,
  Tag,
  Select,
  Table,
  DatePicker,
  Switch
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useIntl, FormattedMessage } from '@umijs/max';
import dayjs, { Dayjs } from 'dayjs';
import { PageContainer } from '@ant-design/pro-layout';
import { getStrategyStatisticsData, listStrategyJob, listAccount } from '@/services/ant-design-pro/api';
import { FilterDropdownProps } from 'antd/es/table/interface';
import { AlignType } from 'rc-table/lib/interface';

const { RangePicker } = DatePicker;

// 添加类型定义
interface OrderRecord {
  time: string;
  accountName: string;
  stockCode: string;
  price: number;
  fillQty?: number;
  number?: number;
  orderNo: string;
  closed?: boolean;
  profitAmount?: number;
  profitPercentage?: number;
  currentPrice?: number;
  currentMarketValue?: number;
  unrealizedProfitLoss?: number;
  unrealizedProfitLossPercentage?: number;
  extra?: string;
  buyOrderNo?: string;
}

const StrategyStatistics: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState<boolean>(false);
  const [statisticsData, setStatisticsData] = useState<API.StrategyStatisticsVO | null>(null);
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
  const [stockCode, setStockCode] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | undefined>(undefined);
  const [strategyOptions, setStrategyOptions] = useState<{label: string, value: number}[]>([]);
  const [accountOptions, setAccountOptions] = useState<{label: string, value: string}[]>([]);
  const [showGainInfo, setShowGainInfo] = useState<boolean>(true);
  const [showMarketValue, setShowMarketValue] = useState<boolean>(true);
  const formRef = useRef<any>();
  
  // 常用股票列表
  const popularStocks = [
    { code: 'TSLA', name: 'Tesla' },
    { code: 'PLTR', name: 'Palantir' },
    { code: 'CRWV', name: 'CRWV' },
    { code: 'CRWD', name: 'CrowdStrike' },
    { code: 'AAPL', name: 'Apple' },
    { code: 'MSFT', name: 'Microsoft' },
    { code: 'AMZN', name: 'Amazon' },
    { code: 'GOOGL', name: 'Google' },
    { code: 'NVDA', name: 'NVIDIA' },
    { code: 'META', name: 'META' },
    { code: 'NBIS', name: 'NBIS' },
    { code: 'CRCL', name: 'CRCL' },
  ];

  // 加载策略和账户选项
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // 获取策略列表
        const strategyRes = await listStrategyJob({
          current: 1,
          pageSize: 100,
        });
        if (strategyRes && strategyRes.data) {
          const options = strategyRes.data.map((item: any) => ({
            label: item.name,
            value: item.id,
          }));
          setStrategyOptions([{ label: '全部策略', value: 0 }, ...options]);
        }
        
        // 获取账户列表
        const accountRes = await listAccount({});
        if (accountRes && accountRes.data) {
          const options = accountRes.data.map((item: any) => ({
            label: `${item.account} (${item.name})`,
            value: item.account,
          }));
          setAccountOptions([{ label: '全部账户', value: '' }, ...options]);
        }
      } catch (error) {
        console.error('获取选项数据失败:', error);
      }
    };
    
    fetchOptions();
  }, []);

  // 处理股票标签点击
  const handleStockTagClick = (code: string) => {
    formRef.current?.setFieldsValue({ stockCode: code });
    setStockCode(code);
    // 立即触发搜索
    fetchStrategyStatistics(code, selectedStrategyId, selectedAccount, dateRange);
  };

  const fetchStrategyStatistics = async (
    stockCodeParam?: string, 
    strategyId?: number, 
    account?: string,
    dateRangeParam?: [Dayjs, Dayjs]
  ) => {
    console.log('开始获取策略统计数据:', { 
      stockCode: stockCodeParam, 
      strategyId, 
      account, 
      dateRange: dateRangeParam 
    });
    setLoading(true);
    try {
      // 对0值的strategyId进行处理，传undefined表示所有策略
      const strategyIdParam = strategyId && strategyId > 0 ? strategyId : undefined;
      
      // 处理日期范围
      let startDate: string | undefined;
      let endDate: string | undefined;
      if (dateRangeParam && dateRangeParam.length === 2) {
        startDate = dateRangeParam[0].format('YYYY-MM-DD');
        endDate = dateRangeParam[1].format('YYYY-MM-DD');
      }
      
      const response = await getStrategyStatisticsData({
        stockCode: stockCodeParam || undefined, // 允许stockCode为空
        strategyId: strategyIdParam,
        account: account || undefined,
        startDate,
        endDate
      });
      
      console.log('API响应数据:', response);
      
      if (response && response.success && response.data) {
        console.log('获取到的策略统计数据:', response.data);
        setStatisticsData(response.data);
      } else {
        message.error(response?.message || '获取策略统计数据失败');
      }
    } catch (error) {
      console.error('获取策略统计数据失败:', error);
      message.error('获取策略统计数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 处理策略选择变化
  const handleStrategyChange = (value: number) => {
    console.log('策略选择变化:', value);
    setSelectedStrategyId(value);
    // 自动触发搜索
    const formValues = formRef.current?.getFieldsValue();
    const currentStockCode = formValues?.stockCode?.trim() || '';
    
    fetchStrategyStatistics(currentStockCode, value, selectedAccount, dateRange);
  };

  // 处理账户选择变化
  const handleAccountChange = (value: string) => {
    console.log('账户选择变化:', value);
    setSelectedAccount(value);
    // 自动触发搜索
    const formValues = formRef.current?.getFieldsValue();
    const currentStockCode = formValues?.stockCode?.trim() || '';
    
    fetchStrategyStatistics(currentStockCode, selectedStrategyId, value, dateRange);
  };

  // 处理日期范围变化
  const handleDateRangeChange = (dates: any) => {
    console.log('日期范围变化:', dates);
    setDateRange(dates);
    // 自动触发搜索
    const formValues = formRef.current?.getFieldsValue();
    const currentStockCode = formValues?.stockCode?.trim() || '';
    
    fetchStrategyStatistics(currentStockCode, selectedStrategyId, selectedAccount, dates);
  };

  const handleSearch = () => {
    const formValues = formRef.current?.getFieldsValue();
    const currentStockCode = formValues?.stockCode?.trim() || '';
    
    // 允许股票代码为空，查询所有股票的数据
    fetchStrategyStatistics(currentStockCode, selectedStrategyId, selectedAccount, dateRange);
  };

  const handleRefresh = () => {
    const formValues = formRef.current?.getFieldsValue();
    const currentStockCode = formValues?.stockCode?.trim() || '';
    fetchStrategyStatistics(currentStockCode, selectedStrategyId, selectedAccount, dateRange);
  };

  const handleStockCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value?.trim() || '';
    setStockCode(value);
  };

  // 修改getColumnSearchProps的类型定义
  const getColumnSearchProps = (dataIndex: keyof OrderRecord, title: string) => ({
    filterDropdown: (props: FilterDropdownProps) => (
      <div style={{ padding: 8 }}>
        <Input
          placeholder={`搜索${title}`}
          value={props.selectedKeys[0]}
          onChange={e => props.setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => props.confirm()}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => props.confirm()}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            搜索
          </Button>
          <Button onClick={() => props.clearFilters?.()} size="small" style={{ width: 90 }}>
            重置
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
    ),
    onFilter: (value: any, record: OrderRecord) => {
      const val = value?.toString() || '';
      return record[dataIndex]
        ? record[dataIndex].toString().toLowerCase().includes(val.toLowerCase())
        : false;
    },
  });

  // 修改买入订单列表的列定义
  const buyOrderColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
    },
    {
      title: '账户',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 120,
      ...getColumnSearchProps('accountName', '账户'),
    },
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 90,
      ...getColumnSearchProps('stockCode', '股票代码'),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      align: 'right' as AlignType,
      render: (text: number) => text?.toFixed(2),
    },
    {
      title: '数量',
      dataIndex: 'fillQty',
      key: 'fillQty',
      width: 90,
      align: 'right' as AlignType,
      render: (text: number | undefined, record: OrderRecord) => text || record.number,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right' as AlignType,
      render: (_: any, record: OrderRecord) => {
        const quantity = record.fillQty || record.number || 0;
        const price = record.price || 0;
        const amount = quantity * price;
        return `$${amount.toFixed(2)}`;
      },
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'closed',
      key: 'closed',
      width: 80,
      align: 'center' as AlignType,
      render: (closed: boolean) => (
        <Tag color={closed ? '#52c41a' : '#f5222d'}>
          {closed ? '已平仓' : '未平仓'}
        </Tag>
      ),
    },
    {
      title: '盈利金额',
      dataIndex: 'profitAmount',
      key: 'profitAmount',
      width: 100,
      align: 'right' as AlignType,
      render: (profitAmount: number | undefined, record: OrderRecord) => {
        if (record.closed !== true) {
          return '-';
        }
        if (profitAmount === undefined || profitAmount === null) return '-';
        return (
          <span style={{ color: profitAmount >= 0 ? '#f5222d' : '#52c41a' }}>
            ${profitAmount.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '盈利百分比',
      dataIndex: 'profitPercentage',
      key: 'profitPercentage',
      width: 100,
      align: 'right' as AlignType,
      render: (profitPercentage: number | undefined, record: OrderRecord) => {
        if (record.closed !== true) {
          return '-';
        }
        if (profitPercentage === undefined || profitPercentage === null) return '-';
        return (
          <span style={{ color: profitPercentage >= 0 ? '#f5222d' : '#52c41a' }}>
            {profitPercentage.toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: '当前价格',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 90,
      align: 'right' as AlignType,
      render: (currentPrice: number | undefined, record: OrderRecord) => {
        if (record.closed === true || !showMarketValue) {
          return '-';
        }
        if (currentPrice === undefined || currentPrice === null) return '-';
        return `$${currentPrice.toFixed(2)}`;
      },
    },
    {
      title: '当前市值',
      dataIndex: 'currentMarketValue',
      key: 'currentMarketValue',
      width: 100,
      align: 'right' as AlignType,
      render: (currentMarketValue: number | undefined, record: OrderRecord) => {
        if (record.closed === true || !showMarketValue) {
          return '-';
        }
        if (currentMarketValue === undefined || currentMarketValue === null) return '-';
        return `$${currentMarketValue.toFixed(2)}`;
      },
    },
    {
      title: '浮动盈亏',
      dataIndex: 'unrealizedProfitLoss',
      key: 'unrealizedProfitLoss',
      width: 100,
      align: 'right' as AlignType,
      render: (unrealizedProfitLoss: number | undefined, record: OrderRecord) => {
        if (record.closed === true || !showMarketValue) {
          return '-';
        }
        if (unrealizedProfitLoss === undefined || unrealizedProfitLoss === null) return '-';
        return (
          <span style={{ color: unrealizedProfitLoss >= 0 ? '#f5222d' : '#52c41a' }}>
            ${unrealizedProfitLoss.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '浮动盈亏率',
      dataIndex: 'unrealizedProfitLossPercentage',
      key: 'unrealizedProfitLossPercentage',
      width: 100,
      align: 'right' as AlignType,
      render: (unrealizedProfitLossPercentage: number | undefined, record: OrderRecord) => {
        if (record.closed === true || !showMarketValue) {
          return '-';
        }
        if (unrealizedProfitLossPercentage === undefined || unrealizedProfitLossPercentage === null) return '-';
        return (
          <span style={{ color: unrealizedProfitLossPercentage >= 0 ? '#f5222d' : '#52c41a' }}>
            {unrealizedProfitLossPercentage.toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'extra',
      key: 'extra',
      ellipsis: true,
    },
  ];

  // 修改卖出订单列表的列定义
  const sellOrderColumns = [
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
    },
    {
      title: '账户',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 120,
      ...getColumnSearchProps('accountName', '账户'),
    },
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 90,
      ...getColumnSearchProps('stockCode', '股票代码'),
    },
    {
      title: '价格',
      dataIndex: 'price',
      key: 'price',
      width: 90,
      align: 'right' as AlignType,
      render: (text: number) => text?.toFixed(2),
    },
    {
      title: '数量',
      dataIndex: 'fillQty',
      key: 'fillQty',
      width: 90,
      align: 'right' as AlignType,
      render: (text: number | undefined, record: OrderRecord) => text || record.number,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 100,
      align: 'right' as AlignType,
      render: (_: any, record: OrderRecord) => {
        const quantity = record.fillQty || record.number || 0;
        const price = record.price || 0;
        const amount = quantity * price;
        return `$${amount.toFixed(2)}`;
      },
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
    },
    {
      title: '对应买入订单号',
      dataIndex: 'buyOrderNo',
      key: 'buyOrderNo',
      width: 160,
      render: (buyOrderNo: string | undefined) => buyOrderNo || '-',
    },
    {
      title: '盈利金额',
      dataIndex: 'profitAmount',
      key: 'profitAmount',
      width: 100,
      align: 'right' as AlignType,
      render: (profitAmount: number | undefined) => {
        if (profitAmount === undefined || profitAmount === null) return '-';
        return (
          <span style={{ color: profitAmount >= 0 ? '#f5222d' : '#52c41a' }}>
            ${profitAmount.toFixed(2)}
          </span>
        );
      },
    },
    {
      title: '盈利百分比',
      dataIndex: 'profitPercentage',
      key: 'profitPercentage',
      width: 100,
      align: 'right' as AlignType,
      render: (profitPercentage: number | undefined) => {
        if (profitPercentage === undefined || profitPercentage === null) return '-';
        return (
          <span style={{ color: profitPercentage >= 0 ? '#f5222d' : '#52c41a' }}>
            {profitPercentage.toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'extra',
      key: 'extra',
      ellipsis: true,
    },
  ];

  // 渲染统计数据
  const renderStatistics = () => {
    if (!statisticsData) return null;
    
    return (
      <>
        {/* 总体统计数据 */}
        <div style={{ marginBottom: 24 }}>
          <h3>
            总体统计
            <Space style={{ marginLeft: 16 }}>
              <Switch
                checkedChildren="显示涨幅"
                unCheckedChildren="隐藏涨幅"
                checked={showGainInfo}
                onChange={setShowGainInfo}
              />
              <Switch
                checkedChildren="显示市值"
                unCheckedChildren="隐藏市值"
                checked={showMarketValue}
                onChange={setShowMarketValue}
              />
            </Space>
          </h3>
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={3}>
              <Statistic
                title="买入订单数"
                value={statisticsData.buyOrderCount || 0}
                precision={0}
                style={{ marginBottom: 0 }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="卖出订单数(含未成交)"
                value={statisticsData.sellOrderCount || 0}
                precision={0}
                style={{ marginBottom: 0 }}
              />
            </Col>
            <Col span={3}>
              <Statistic
                title="盈利订单数"
                value={statisticsData.profitOrderCount || 0}
                precision={0}
                style={{ marginBottom: 0 }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="总盈利金额"
                value={statisticsData.totalProfit || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: (statisticsData.totalProfit || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                style={{ marginBottom: 0 }}
              />
            </Col>
            <Col span={3}>
              <Statistic
                title="盈利百分比"
                value={statisticsData.totalProfitPercentage || 0}
                precision={2}
                suffix="%"
                valueStyle={{ color: (statisticsData.totalProfitPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                style={{ marginBottom: 0 }}
              />
            </Col>
            <Col span={3}>
              <Statistic
                title="未完成订单数"
                value={statisticsData.unfinishedOrderCount || 0}
                precision={0}
                style={{ marginBottom: 0 }}
              />
            </Col>
            <Col span={4}>
              <Statistic
                title="平均买入金额"
                value={statisticsData.averageBuyAmount || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
                style={{ marginBottom: 0 }}
              />
            </Col>
          </Row>
          
          {/* 第二行统计数据 */}
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={5}>
              <Statistic
                title="未完成总金额"
                value={statisticsData.totalUnfinishedAmount || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#f5222d' }}
                style={{ marginBottom: 0 }}
              />
            </Col>
            {showMarketValue && (
              <>
                <Col span={4}>
                  <Statistic
                    title="当前市值"
                    value={statisticsData.currentMarketValue || 0}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: '#722ed1' }}
                    style={{ marginBottom: 0 }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="浮动盈亏"
                    value={statisticsData.unrealizedProfitLoss || 0}
                    precision={2}
                    prefix="$"
                    valueStyle={{ color: (statisticsData.unrealizedProfitLoss || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                    style={{ marginBottom: 0 }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title="浮动盈亏率"
                    value={statisticsData.unrealizedProfitLossPercentage || 0}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: (statisticsData.unrealizedProfitLossPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                    style={{ marginBottom: 0 }}
                  />
                </Col>
              </>
            )}
            {showGainInfo && (
              <>
                <Col span={4}>
                  <Statistic
                    title="同期QQQ涨幅"
                    value={statisticsData.qqqGainPercentage || 0}
                    precision={2}
                    suffix="%"
                    valueStyle={{ color: (statisticsData.qqqGainPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                    style={{ marginBottom: 0 }}
                  />
                </Col>
                {statisticsData.stockCode && (
                  <Col span={4}>
                    <Statistic
                      title={`同期${statisticsData.stockCode}涨幅`}
                      value={statisticsData.stockGainPercentage || 0}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: (statisticsData.stockGainPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                )}
              </>
            )}
          </Row>
          
          {/* 第三行统计数据 */}
          <Row gutter={16} style={{ marginBottom: 12 }}>
            {(statisticsData.gainStartTime && statisticsData.gainEndTime) && (
              <Col span={12}>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                  时间范围：{statisticsData.gainStartTime} 至 {statisticsData.gainEndTime}
                </div>
              </Col>
            )}
          </Row>
        </div>

        {/* 每个股票的统计数据 */}
        {statisticsData.stockStatistics && Object.keys(statisticsData.stockStatistics).length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <Divider orientation="left">各股票统计</Divider>
            {Object.entries(statisticsData.stockStatistics).map(([stockCode, stockData]) => (
              <Card
                key={stockCode}
                title={`${stockCode} 统计数据`}
                style={{ marginBottom: 16 }}
                type="inner"
              >
                <Row gutter={16} style={{ marginBottom: 12 }}>
                  <Col span={3}>
                    <Statistic
                      title="买入订单数"
                      value={stockData.buyOrderCount || 0}
                      precision={0}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="卖出订单数(含未成交)"
                      value={stockData.sellOrderCount || 0}
                      precision={0}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  <Col span={3}>
                    <Statistic
                      title="盈利订单数"
                      value={stockData.profitOrderCount || 0}
                      precision={0}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="总盈利金额"
                      value={stockData.totalProfit || 0}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: (stockData.totalProfit || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  <Col span={3}>
                    <Statistic
                      title="盈利百分比"
                      value={stockData.totalProfitPercentage || 0}
                      precision={2}
                      suffix="%"
                      valueStyle={{ color: (stockData.totalProfitPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  <Col span={3}>
                    <Statistic
                      title="未完成订单数"
                      value={stockData.unfinishedOrderCount || 0}
                      precision={0}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  <Col span={4}>
                    <Statistic
                      title="平均买入金额"
                      value={stockData.averageBuyAmount || 0}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#1890ff' }}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                </Row>

                <Row gutter={16} style={{ marginBottom: 12 }}>
                  <Col span={5}>
                    <Statistic
                      title="未完成总金额"
                      value={stockData.totalUnfinishedAmount || 0}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#f5222d' }}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  {showMarketValue && (
                    <>
                      <Col span={4}>
                        <Statistic
                          title="当前市值"
                          value={stockData.currentMarketValue || 0}
                          precision={2}
                          prefix="$"
                          valueStyle={{ color: '#722ed1' }}
                          style={{ marginBottom: 0 }}
                        />
                      </Col>
                      <Col span={4}>
                        <Statistic
                          title="浮动盈亏"
                          value={stockData.unrealizedProfitLoss || 0}
                          precision={2}
                          prefix="$"
                          valueStyle={{ color: (stockData.unrealizedProfitLoss || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                          style={{ marginBottom: 0 }}
                        />
                      </Col>
                      <Col span={4}>
                        <Statistic
                          title="浮动盈亏率"
                          value={stockData.unrealizedProfitLossPercentage || 0}
                          precision={2}
                          suffix="%"
                          valueStyle={{ color: (stockData.unrealizedProfitLossPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                          style={{ marginBottom: 0 }}
                        />
                      </Col>
                    </>
                  )}
                  {showGainInfo && (
                    <>
                      <Col span={4}>
                        <Statistic
                          title="同期QQQ涨幅"
                          value={stockData.qqqGainPercentage || 0}
                          precision={2}
                          suffix="%"
                          valueStyle={{ color: (stockData.qqqGainPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                          style={{ marginBottom: 0 }}
                        />
                      </Col>
                      <Col span={4}>
                        <Statistic
                          title={`同期${stockCode}涨幅`}
                          value={stockData.stockGainPercentage || 0}
                          precision={2}
                          suffix="%"
                          valueStyle={{ color: (stockData.stockGainPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                          style={{ marginBottom: 0 }}
                        />
                      </Col>
                    </>
                  )}
                </Row>

                {showGainInfo && (stockData.gainStartTime && stockData.gainEndTime) && (
                  <Row gutter={16} style={{ marginBottom: 12 }}>
                    <Col span={12}>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                        时间范围：{stockData.gainStartTime} 至 {stockData.gainEndTime}
                      </div>
                    </Col>
                  </Row>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* 订单列表 */}
        <Divider orientation="left">订单明细</Divider>
        <Row>
          <Col span={24}>
            <div style={{ marginBottom: 8 }}>
              <Space>
                <Tag color="#f5222d">买入订单: {statisticsData.buyOrderCount || 0}个</Tag>
                <Tag color="#52c41a">卖出订单: {statisticsData.sellOrderCount || 0}个</Tag>
                <Tag color="#fa8c16">盈利订单: {statisticsData.profitOrderCount || 0}个</Tag>
                <Tag color="#722ed1">未完成订单: {statisticsData.unfinishedOrderCount || 0}个</Tag>
              </Space>
            </div>
            
            {/* 买入订单列表 */}
            <div style={{ marginBottom: 16 }}>
              <h4><Tag color="#f5222d" style={{ marginRight: 8 }}>买入订单列表</Tag></h4>
              <Table
                size="small"
                rowKey={(record) => record.orderNo || `${record.time}-${record.price}`}
                dataSource={statisticsData.buyOrders || []}
                columns={buyOrderColumns}
                pagination={{ pageSize: 20 }}
                bordered
                scroll={{ x: true }}
              />
            </div>
            
            {/* 卖出订单列表 */}
            <div>
              <h4><Tag color="#52c41a" style={{ marginRight: 8 }}>卖出订单列表</Tag></h4>
              <Table
                size="small"
                rowKey={(record) => record.orderNo || `${record.time}-${record.price}`}
                dataSource={statisticsData.sellOrders || []}
                columns={sellOrderColumns}
                pagination={{ pageSize: 20 }}
                bordered
                scroll={{ x: true }}
              />
            </div>
          </Col>
        </Row>
      </>
    );
  };

  return (
    <PageContainer>
      <Card>
        <Form ref={formRef} layout="inline" onFinish={handleSearch}>
          <Form.Item 
            name="stockCode"
            label="股票代码"
          >
            <Input 
              placeholder="请输入股票代码(可选)"
              style={{ width: 180 }}
              allowClear
              onChange={handleStockCodeChange}
            />
          </Form.Item>
          
          <Form.Item label="策略">
            <Select
              placeholder="选择策略"
              style={{ width: 180 }}
              options={strategyOptions}
              onChange={handleStrategyChange}
              value={selectedStrategyId}
            />
          </Form.Item>
          
          <Form.Item label="账户">
            <Select
              placeholder="选择账户"
              style={{ width: 180 }}
              options={accountOptions}
              onChange={handleAccountChange}
              value={selectedAccount}
            />
          </Form.Item>
          
          <Form.Item label="时间范围">
            <RangePicker
              style={{ width: 240 }}
              onChange={handleDateRangeChange}
              value={dateRange}
              ranges={{
                '近1天': [dayjs().subtract(1, 'day'), dayjs()],
                '近5天': [dayjs().subtract(5, 'day'), dayjs()],
                '近10天': [dayjs().subtract(10, 'day'), dayjs()],
                '近30天': [dayjs().subtract(30, 'day'), dayjs()],
                '近1年': [dayjs().subtract(365, 'day'), dayjs()],
              }}
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleRefresh}
                disabled={!statisticsData}
              >
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>

        {/* 常用股票标签 */}
        <div style={{ marginTop: 12 }}>
          <Space wrap size="small">
            {popularStocks.map((stock) => (
              <Tag 
                key={stock.code}
                color={stockCode === stock.code ? 'blue' : 'default'}
                style={{ cursor: 'pointer', padding: '4px 8px' }}
                onClick={() => handleStockTagClick(stock.code)}
              >
                {stock.code}
              </Tag>
            ))}
          </Space>
        </div>
      </Card>

      <Spin spinning={loading}>
        <Card 
          title="策略订单统计"
          style={{ marginTop: 16 }}
          bodyStyle={{ padding: '12px 24px' }}
        >
          {statisticsData ? (
            <>
              {renderStatistics()}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              暂无数据，请设置筛选条件后点击搜索按钮
            </div>
          )}
        </Card>
      </Spin>
    </PageContainer>
  );
};

export default StrategyStatistics; 