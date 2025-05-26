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
  Tooltip, 
  Form,
  Radio,
  Divider,
  Tag,
  Select,
  Table
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useIntl, FormattedMessage } from '@umijs/max';
import moment from 'moment';
import { PageContainer } from '@ant-design/pro-layout';
import { getStockMinuteData, listStrategyJob, listAccount } from '@/services/ant-design-pro/api';
// 引入新的StockChartWrapper组件
import StockChartWrapper from './StockChartWrapper';

// 移除K线图相关类型定义
interface DataPoint {
  time: string;
  value: number;
  type: string;
  rawTime?: string;
  orderNo?: string;
  number?: number;
  fillQty?: number;
  accountName?: string;
  extra?: string;
  pointId?: string;
  pointType?: 'buy' | 'sell';
}

// 买卖点数据接口
interface TradePoint {
  time: string;
  price: number;
  orderNo: string;
  number?: number;
  fillQty?: number;
  accountName?: string;
  extra?: string;
  pointType?: 'buy' | 'sell'; // 添加点类型
  sellOrderNo?: string;
  sellOrderTime?: string;
  buyOrderNo?: string;
  buyOrderTime?: string;
  closed?: boolean;
  profitAmount?: number;
  profitPercentage?: number;
}

// K线图所需的数据格式
interface KLineData {
  timestamp: number;  // 时间戳
  open: number;       // 开盘价
  high: number;       // 最高价
  low: number;        // 最低价
  close: number;      // 收盘价
  volume?: number;    // 成交量（可选）
}

// 标记点位数据格式
interface MarkPoint {
  id?: string;
  coordinate: [number, number]; // [timestamp, price]
  value?: string;
  color?: string;
  pointType?: 'buy' | 'sell';
  orderNo?: string;
  accountName?: string;
  extra?: string;
  number?: number;
  fillQty?: number;
}

const StockChart: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState<boolean>(false);
  const [stockCode, setStockCode] = useState<string>('');
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [stockChartData, setStockChartData] = useState<API.StockMinuteVO | null>(null);
  const [days, setDays] = useState<number>(1); // 默认1天
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | undefined>(undefined);
  const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
  const [strategyOptions, setStrategyOptions] = useState<{label: string, value: number}[]>([]);
  const [accountOptions, setAccountOptions] = useState<{label: string, value: string}[]>([]);
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

  // 股票分时图组件挂载点更新逻辑
  useEffect(() => {
    // 确保DOM已经挂载
    console.log('股票图表组件已挂载');
    
    return () => {
      console.log('股票图表组件将卸载');
    };
  }, []);

  // 处理股票标签点击
  const handleStockTagClick = (code: string) => {
    // 设置表单字段值
    formRef.current?.setFieldsValue({ stockCode: code });
    setStockCode(code);
    // 立即触发搜索
    fetchStockMinuteData(code, days, selectedStrategyId, selectedAccount);
  };

  const fetchStockMinuteData = async (code: string, selectedDays: number, strategyId?: number, account?: string) => {
    if (!code) {
      message.error(intl.formatMessage({ id: 'pages.stockChart.stockCodeRequired' }));
      return;
    }
    
    console.log('开始获取股票分时数据:', { code, days: selectedDays, strategyId, account });
    setLoading(true);
    try {
      // 对0值的strategyId进行处理，传undefined表示所有策略
      const strategyIdParam = strategyId && strategyId > 0 ? strategyId : undefined;
      
      const response = await getStockMinuteData(code, selectedDays, strategyIdParam, account);
      console.log('API响应数据:', response);
      
      if (response && response.data) {
        console.log('获取到的分时数据:', response.data);
        console.log('分时数据点数:', response.data.minuteData?.length || 0);
        console.log('买入点数:', response.data.buyPoints?.length || 0);
        console.log('卖出点数:', response.data.sellPoints?.length || 0);
        
        setStockChartData(response.data);
        transformDataForChart(response.data);
      } else {
        message.error(response?.message || intl.formatMessage({ id: 'pages.stockChart.fetchFailed' }));
      }
    } catch (error) {
      console.error('获取股票分时数据失败:', error);
      message.error(intl.formatMessage({ id: 'pages.stockChart.fetchFailed' }));
    } finally {
      setLoading(false);
    }
  };

  // 处理策略选择变化
  const handleStrategyChange = (value: number) => {
    setSelectedStrategyId(value);
    if (stockCode) {
      fetchStockMinuteData(stockCode, days, value, selectedAccount);
    }
  };

  // 处理账户选择变化
  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
    if (stockCode) {
      fetchStockMinuteData(stockCode, days, selectedStrategyId, value);
    }
  };

  const transformDataForChart = (data: API.StockMinuteVO) => {
    // 分开存储不同类型的数据
    const priceData: DataPoint[] = [];
    const avgPriceData: DataPoint[] = [];
    const buyPointsData: DataPoint[] = [];
    const sellPointsData: DataPoint[] = [];
    
    console.log('开始转换数据:', data);
    
    // 添加分时数据和均价
    if (data.minuteData && data.minuteData.length > 0) {
      console.log('分时数据长度:', data.minuteData.length);
      data.minuteData.forEach((item) => {
        console.log('分时数据:', item);
        const time = moment(item.timestamp).format('MM-DD HH:mm');
        
        // 添加当前价格
        priceData.push({
          time,
          value: item.current,
          type: intl.formatMessage({ id: 'pages.stockChart.currentPrice' }),
          rawTime: moment(item.timestamp).format('YYYY-MM-DD HH:mm:ss')
        });
        
        // 添加均价线 - 如果后端提供了均价则使用，否则使用当前价格的95%作为模拟均价
        const avgPrice = item.avgPrice || (item.current * 0.95);
        avgPriceData.push({
          time,
          value: avgPrice,
          type: intl.formatMessage({ id: 'pages.stockChart.avgPrice' }),
          rawTime: moment(item.timestamp).format('YYYY-MM-DD HH:mm:ss')
        });
      });
    }
    
    // 添加买入点（后端已经按时间过滤）
    if (data.buyPoints && data.buyPoints.length > 0) {
      console.log('买入点数据长度:', data.buyPoints.length);
      data.buyPoints.forEach((point) => {
        try {
          // 直接使用后端已转换为北京时间的时间戳
          const pointTime = moment(point.time, 'YYYY-MM-DD HH:mm:ss');
          const time = pointTime.format('MM-DD HH:mm');

          buyPointsData.push({
            time,
            value: point.price,
            type: intl.formatMessage({ id: 'pages.stockChart.buyPoint' }),
            rawTime: point.time,
            orderNo: point.orderNo,
            number: point.number,
            fillQty: point.fillQty,
            accountName: point.accountName,
            extra: point.extra,
            pointType: 'buy',
            pointId: `buy_${point.orderNo || point.time}`
          });
        } catch (err) {
          console.error('处理买入点失败:', err, point);
        }
      });
    }
    
    // 添加卖出点（后端已经按时间过滤）
    if (data.sellPoints && data.sellPoints.length > 0) {
      console.log('卖出点数据长度:', data.sellPoints.length);
      data.sellPoints.forEach((point) => {
        try {
          // 直接使用后端已转换为北京时间的时间戳
          const pointTime = moment(point.time, 'YYYY-MM-DD HH:mm:ss');
          const time = pointTime.format('MM-DD HH:mm');

          sellPointsData.push({
            time,
            value: point.price,
            type: intl.formatMessage({ id: 'pages.stockChart.sellPoint' }),
            rawTime: point.time,
            orderNo: point.orderNo,
            number: point.number,
            fillQty: point.fillQty,
            accountName: point.accountName,
            extra: point.extra,
            pointType: 'sell',
            pointId: `sell_${point.orderNo || point.time}`
          });
        } catch (err) {
          console.error('处理卖出点失败:', err, point);
        }
      });
    }

    // 合并所有数据
    const chartData = [...priceData, ...avgPriceData, ...buyPointsData, ...sellPointsData];
    console.log('图表数据处理完成, 总数据点:', chartData.length);
    setChartData(chartData);
  };

  const handleSearch = () => {
    const values = formRef.current?.getFieldsValue();
    if (values && values.stockCode) {
      setStockCode(values.stockCode.toUpperCase());
      fetchStockMinuteData(values.stockCode.toUpperCase(), days, selectedStrategyId, selectedAccount);
    }
  };

  const handleRefresh = () => {
    if (stockCode) {
      fetchStockMinuteData(stockCode, days, selectedStrategyId, selectedAccount);
    }
  };

  const handleDaysChange = (e: any) => {
    const selectedDays = e.target.value;
    setDays(selectedDays);
    if (stockCode) {
      fetchStockMinuteData(stockCode, selectedDays, selectedStrategyId, selectedAccount);
    }
  };

  // 检查图表数据完整性
  const checkDataIntegrity = () => {
    console.log('检查图表数据完整性:');
    console.log('- chartData长度:', chartData.length);
    
    if (chartData.length === 0) {
      console.error('图表数据为空');
      return false;
    }
    
    // 检查数据格式
    const firstPoint = chartData[0];
    
    // 安全地检查必需字段
    if (!firstPoint.time || !firstPoint.value || !firstPoint.type) {
      console.error('图表数据缺少必需字段');
      return false;
    }
    
    console.log('图表数据完整性检查通过');
    message.success('数据检查通过');
    return true;
  };

  // 添加测试数据生成函数
  const generateTestData = () => {
    console.log('生成测试数据');
    const testData: DataPoint[] = [];
    const now = moment();
    
    // 生成当前价格线和均价线
    for (let i = 0; i < 60; i++) {
      const time = moment(now).subtract(60 - i, 'minutes');
      const formattedTime = time.format('MM-DD HH:mm');
      const rawTime = time.format('YYYY-MM-DD HH:mm:ss');
      
      // 使用正弦函数生成波动的价格，使其看起来更自然
      const price = 100 + Math.sin(i / 10) * 5 + Math.random() * 2;
      
      // 当前价格
      testData.push({
        time: formattedTime,
        value: price,
        type: '当前价',
        rawTime: rawTime
      });
      
      // 均价线 - 保持略低于当前价格，体现出均价的特性
      testData.push({
        time: formattedTime,
        value: price * 0.95 + Math.random() * 0.5,  // 均价约为当前价的95%左右，有一定随机波动
        type: '均价',
        rawTime: rawTime
      });
    }
    
    // 添加买入点
    testData.push({
      time: moment(now).subtract(45, 'minutes').format('MM-DD HH:mm'),
      value: 102.5,
      type: '买入点',
      pointType: 'buy',
      orderNo: 'TEST_BUY_001',
      rawTime: moment(now).subtract(45, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
      accountName: '测试账户',
      number: 100,
      fillQty: 100
    });
    
    // 添加卖出点
    testData.push({
      time: moment(now).subtract(15, 'minutes').format('MM-DD HH:mm'),
      value: 105.2,
      type: '卖出点',
      pointType: 'sell',
      orderNo: 'TEST_SELL_001',
      rawTime: moment(now).subtract(15, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
      accountName: '测试账户',
      number: 100,
      fillQty: 100
    });
    
    // 设置数据状态
    setChartData(testData);
    
    message.success('测试数据已加载，包含价格线、均价线和买卖点');
    
    // 打印测试数据以便调试
    console.log('生成的测试数据：', {
      总数: testData.length,
      价格线: testData.filter(p => p.type === '当前价').length,
      均价线: testData.filter(p => p.type === '均价').length,
      买点: testData.filter(p => p.type === '买入点' || p.pointType === 'buy').length,
      卖点: testData.filter(p => p.type === '卖出点' || p.pointType === 'sell').length
    });
  };

  // 渲染图表
  const renderStockChart = () => {
    console.log('渲染图表, 数据点数:', chartData.length);
    
    return (
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <StockChartWrapper 
          chartData={chartData}
          height={380}
        />
        
        {/* 调试工具按钮 - 仅在开发环境显示 */}
        {/*
        {process.env.NODE_ENV !== 'production' && (
          <div style={{ marginTop: '8px' }}>
            <Space>
              <Button 
                size="small" 
                onClick={() => checkDataIntegrity()}
              >
                检查数据
              </Button>
              <Button 
                size="small" 
                type="primary"
                onClick={() => generateTestData()}
              >
                生成测试数据
              </Button>
              <Button
                size="small" 
                type="default"
                onClick={() => {
                  console.log('输出当前图表数据');
                  if (chartData.length > 0) {
                    console.log('数据类型:', new Set(chartData.map(item => item.type)));
                    console.log('第一条数据:', chartData[0]);
                    console.log('买入点:', chartData.filter(item => item.type.includes('买入点') || item.pointType === 'buy'));
                    console.log('卖出点:', chartData.filter(item => item.type.includes('卖出点') || item.pointType === 'sell'));
                    console.log('当前价:', chartData.filter(item => item.type.includes('当前价')).length);
                    console.log('均价:', chartData.filter(item => item.type.includes('均价')).length);
                  } else {
                    message.warning('当前没有图表数据');
                  }
                }}
              >
                调试输出
              </Button>
            </Space>
          </div>
        )}*/}
      </div>
    );
  };

  const getLatestPrice = () => {
    if (stockChartData?.minuteData && stockChartData.minuteData.length > 0) {
      const sortedData = [...stockChartData.minuteData].sort((a, b) => b.timestamp - a.timestamp);
      return sortedData[0].current;
    }
    return null;
  };

  const getLatestPercentage = () => {
    if (stockChartData?.minuteData && stockChartData.minuteData.length > 0) {
      const sortedData = [...stockChartData.minuteData].sort((a, b) => b.timestamp - a.timestamp);
      return sortedData[0].percent;
    }
    return null;
  };
  
  // 渲染订单盈利统计
  const renderProfitStatistics = () => {
    if (!stockChartData?.profitStatistics) return null;
    
    const { 
      profitOrderCount, 
      totalBuyAmount, 
      totalSellAmount, 
      totalProfit, 
      totalProfitPercentage 
    } = stockChartData.profitStatistics;
    
    return (
      <>
        <Col span={3}>
          <Statistic
            title="盈利订单数"
            value={profitOrderCount || 0}
            precision={0}
            style={{ marginBottom: 0 }}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="盈利总额"
            value={totalProfit || 0}
            precision={2}
            prefix="$"
            valueStyle={{ color: (totalProfit || 0) >= 0 ? '#f5222d' : '#52c41a' }}
            style={{ marginBottom: 0 }}
          />
        </Col>
        <Col span={3}>
          <Statistic
            title="盈利百分比"
            value={totalProfitPercentage || 0}
            precision={2}
            suffix="%"
            valueStyle={{ color: (totalProfitPercentage || 0) >= 0 ? '#f5222d' : '#52c41a' }}
            style={{ marginBottom: 0 }}
          />
        </Col>
      </>
    );
  };
  
  // 渲染未止盈订单统计
  const renderUnfinishedProfitStatistics = () => {
    if (!stockChartData?.unfinishedProfitStatistics) return null;
    
    const { 
      unfinishedOrderCount, 
      totalUnfinishedAmount 
    } = stockChartData.unfinishedProfitStatistics;
    
    return (
      <>
        <Col span={3}>
          <Statistic
            title="未止盈订单数"
            value={unfinishedOrderCount || 0}
            precision={0}
            style={{ marginBottom: 0 }}
          />
        </Col>
        <Col span={4}>
          <Statistic
            title="未止盈总金额"
            value={totalUnfinishedAmount || 0}
            precision={2}
            prefix="$"
            valueStyle={{ color: '#f5222d' }}
            style={{ marginBottom: 0 }}
          />
        </Col>
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
            rules={[{ required: true, message: "请输入股票代码" }]}
          >
            <Input 
              placeholder="请输入股票代码"
              style={{ width: 180 }}
              allowClear
            />
          </Form.Item>
          
          <Form.Item label="时间范围">
            <Radio.Group value={days} onChange={handleDaysChange}>
              <Radio.Button value={1}>1天</Radio.Button>
              <Radio.Button value={5}>5天</Radio.Button>
            </Radio.Group>
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
                disabled={!stockCode}
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
                <Tooltip title={stock.name}>
                  {stock.code}
                </Tooltip>
              </Tag>
            ))}
          </Space>
        </div>
      </Card>

      {stockCode && (
        <Spin spinning={loading}>
          <Card 
            title={`${stockCode} 价格走势图`}
            style={{ marginTop: 16 }}
            bodyStyle={{ padding: '12px 24px' }} // 减小卡片内边距
          >
            {chartData.length > 0 ? (
              <>
                <Row gutter={16} style={{ marginBottom: 12 }}>
                  <Col span={3}>
                    <Statistic
                      title="最新价格"
                      value={getLatestPrice() || 0}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#1890ff' }}
                      style={{ marginBottom: 0 }} // 减小统计数据的下边距
                    />
                  </Col>
                  <Col span={3}>
                    <Statistic
                      title="涨跌幅"
                      value={getLatestPercentage() || 0}
                      precision={2}
                      valueStyle={{ color: (getLatestPercentage() || 0) >= 0 ? '#f5222d' : '#52c41a' }}
                      suffix="%"
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  <Col span={3}>
                    <Statistic
                      title="买入点数"
                      value={stockChartData?.buyPoints?.length || 0}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                  <Col span={3}>
                    <Statistic
                      title="卖出点数"
                      value={stockChartData?.sellPoints?.length || 0}
                      style={{ marginBottom: 0 }}
                    />
                  </Col>
                </Row>
                
                {/* 盈利统计和未止盈订单统计数据另起一行 */}
                {(stockChartData?.profitStatistics || stockChartData?.unfinishedProfitStatistics) && (
                  <Row gutter={16} style={{ marginBottom: 12 }}>
                    {stockChartData?.profitStatistics && renderProfitStatistics()}
                    {stockChartData?.unfinishedProfitStatistics && renderUnfinishedProfitStatistics()}
                  </Row>
                )}
                
                <Row>
                  <Col span={24} style={{ position: 'relative', width: '100%' }}>
                    {renderStockChart()}
                  </Col>
                </Row>
                
                {/* 新增买卖点订单列表 */}
                <Divider orientation="left">{intl.formatMessage({ id: 'pages.stockChart.orderPoints' })}</Divider>
                <Row>
                  <Col span={24}>
                    <div style={{ marginBottom: 8 }}>
                      <Space>
                        <Tag color="#f5222d">买入点: {stockChartData?.buyPoints?.length || 0}个</Tag>
                        <Tag color="#52c41a">卖出点: {stockChartData?.sellPoints?.length || 0}个</Tag>
                      </Space>
                    </div>
                    
                    {/* 买入点列表 */}
                    <div style={{ marginBottom: 16 }}>
                      <h4><Tag color="#f5222d" style={{ marginRight: 8 }}>买入点列表</Tag></h4>
                      <Table
                        size="small"
                        rowKey={(record) => record.orderNo || `${record.time}-${record.price}`}
                        dataSource={(stockChartData?.buyPoints || []).sort((a, b) => {
                          const timeA = new Date(a.time).getTime();
                          const timeB = new Date(b.time).getTime();
                          return timeA - timeB; // 按时间升序排序
                        })}
                        columns={[
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.time' }),
                            dataIndex: 'time',
                            key: 'time',
                            width: 160,
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.account' }),
                            dataIndex: 'accountName',
                            key: 'accountName',
                            width: 120,
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.price' }),
                            dataIndex: 'price',
                            key: 'price',
                            width: 90,
                            align: 'right',
                            render: (text) => text?.toFixed(2),
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.quantity' }),
                            dataIndex: 'fillQty',
                            key: 'fillQty',
                            width: 90,
                            align: 'right',
                            render: (text, record) => text || record.number,
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.searchTable.amount' }),
                            dataIndex: 'amount',
                            key: 'amount',
                            width: 100,
                            align: 'right',
                            render: (_, record) => {
                              const quantity = record.fillQty || record.number || 0;
                              const price = record.price || 0;
                              const amount = quantity * price;
                              return `$${amount.toFixed(2)}`;
                            },
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.orderNo' }),
                            dataIndex: 'orderNo',
                            key: 'orderNo',
                            width: 160,
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.isClosed' }),
                            dataIndex: 'closed',
                            key: 'closed',
                            width: 80,
                            align: 'center',
                            render: (closed) => (
                              <Tag color={closed ? '#52c41a' : '#f5222d'}>
                                {closed ? '已平仓' : '未平仓'}
                              </Tag>
                            ),
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.sellOrderNo' }),
                            dataIndex: 'sellOrderNo',
                            key: 'sellOrderNo',
                            width: 160,
                            render: (sellOrderNo) => sellOrderNo || '-',
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.sellOrderTime' }),
                            dataIndex: 'sellOrderTime',
                            key: 'sellOrderTime',
                            width: 160,
                            render: (sellOrderTime, record: any) => {
                              // 更精确的未平仓判断
                              if (!sellOrderTime || (!record.closed && record.closed !== undefined)) {
                                return '-'
                              }
                              return sellOrderTime;
                            },
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.profitAmount' }),
                            dataIndex: 'profitAmount',
                            key: 'profitAmount',
                            width: 100,
                            align: 'right',
                            render: (profitAmount, record: any) => {
                              // 如果未平仓(closed不为true)，显示"-"
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
                            title: intl.formatMessage({ id: 'pages.stockChart.profitPercentage' }),
                            dataIndex: 'profitPercentage',
                            key: 'profitPercentage',
                            width: 100,
                            align: 'right',
                            render: (profitPercentage, record: any) => {
                              // 如果未平仓(closed不为true)，显示"-"
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
                            title: intl.formatMessage({ id: 'pages.stockChart.extra' }),
                            dataIndex: 'extra',
                            key: 'extra',
                            ellipsis: true,
                          },
                        ]}
                        pagination={false}
                        bordered
                        scroll={{ x: true }}
                      />
                    </div>
                    
                    {/* 卖出点列表 */}
                    <div>
                      <h4><Tag color="#52c41a" style={{ marginRight: 8 }}>卖出点列表</Tag></h4>
                      <Table
                        size="small"
                        rowKey={(record) => record.orderNo || `${record.time}-${record.price}`}
                        dataSource={(stockChartData?.sellPoints || []).sort((a, b) => {
                          const timeA = new Date(a.time).getTime();
                          const timeB = new Date(b.time).getTime();
                          return timeA - timeB; // 按时间升序排序
                        })}
                        columns={[
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.time' }),
                            dataIndex: 'time',
                            key: 'time',
                            width: 160,
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.account' }),
                            dataIndex: 'accountName',
                            key: 'accountName',
                            width: 120,
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.price' }),
                            dataIndex: 'price',
                            key: 'price',
                            width: 90,
                            align: 'right',
                            render: (text) => text?.toFixed(2),
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.quantity' }),
                            dataIndex: 'fillQty',
                            key: 'fillQty',
                            width: 90,
                            align: 'right',
                            render: (text, record) => text || record.number,
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.searchTable.amount' }),
                            dataIndex: 'amount',
                            key: 'amount',
                            width: 100,
                            align: 'right',
                            render: (_, record) => {
                              const quantity = record.fillQty || record.number || 0;
                              const price = record.price || 0;
                              const amount = quantity * price;
                              return `$${amount.toFixed(2)}`;
                            },
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.orderNo' }),
                            dataIndex: 'orderNo',
                            key: 'orderNo',
                            width: 160,
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.buyOrderNo' }),
                            dataIndex: 'buyOrderNo',
                            key: 'buyOrderNo',
                            width: 160,
                            render: (buyOrderNo) => buyOrderNo || '-',
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.buyOrderTime' }),
                            dataIndex: 'buyOrderTime',
                            key: 'buyOrderTime',
                            width: 160,
                            render: (buyOrderTime) => buyOrderTime || '-',
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.profitAmount' }),
                            dataIndex: 'profitAmount',
                            key: 'profitAmount',
                            width: 100,
                            align: 'right',
                            render: (profitAmount) => {
                              if (profitAmount === undefined || profitAmount === null) return '-';
                              return (
                                <span style={{ color: profitAmount >= 0 ? '#f5222d' : '#52c41a' }}>
                                  ${profitAmount.toFixed(2)}
                                </span>
                              );
                            },
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.profitPercentage' }),
                            dataIndex: 'profitPercentage',
                            key: 'profitPercentage',
                            width: 100,
                            align: 'right',
                            render: (profitPercentage) => {
                              if (profitPercentage === undefined || profitPercentage === null) return '-';
                              return (
                                <span style={{ color: profitPercentage >= 0 ? '#f5222d' : '#52c41a' }}>
                                  {profitPercentage.toFixed(2)}%
                                </span>
                              );
                            },
                          },
                          {
                            title: intl.formatMessage({ id: 'pages.stockChart.extra' }),
                            dataIndex: 'extra',
                            key: 'extra',
                            ellipsis: true,
                          },
                        ]}
                        pagination={false}
                        bordered
                        scroll={{ x: true }}
                      />
                    </div>
                  </Col>
                </Row>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                暂无数据
              </div>
            )}
          </Card>
        </Spin>
      )}
    </PageContainer>
  );
};

export default StockChart; 