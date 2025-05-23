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
import { Line } from '@ant-design/plots';
import { useIntl, FormattedMessage } from '@umijs/max';
import moment from 'moment';
import { PageContainer } from '@ant-design/pro-layout';
import { getStockMinuteData, listStrategyJob, listAccount } from '@/services/ant-design-pro/api';

// 在文件顶部添加类型定义
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

const StockChart: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState<boolean>(false);
  const [stockCode, setStockCode] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
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
    
    setLoading(true);
    try {
      // 对0值的strategyId进行处理，传undefined表示所有策略
      const strategyIdParam = strategyId && strategyId > 0 ? strategyId : undefined;
      
      const response = await getStockMinuteData(code, selectedDays, strategyIdParam, account);
      if (response && response.data) {
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
    
    // 添加分时数据和均价
    if (data.minuteData && data.minuteData.length > 0) {
      data.minuteData.forEach((item) => {
        const time = moment(item.timestamp).format('MM-DD HH:mm');
        
        // 添加当前价格
        priceData.push({
          time,
          value: item.current,
          type: intl.formatMessage({ id: 'pages.stockChart.currentPrice' }),
        });
        
        // 添加均价线
        if (item.avgPrice) {
          avgPriceData.push({
            time,
            value: item.avgPrice,
            type: intl.formatMessage({ id: 'pages.stockChart.avgPrice' }),
          });
        }
      });
    }
    
    // 添加买入点（后端已经按时间过滤）
    if (data.buyPoints && data.buyPoints.length > 0) {
      data.buyPoints.forEach((point) => {
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
          // 为每个点添加唯一ID，避免连线
          pointId: `buy_${point.orderNo || point.time}`
        });
      });
    }
    
    // 添加卖出点（后端已经按时间过滤）
    if (data.sellPoints && data.sellPoints.length > 0) {
      data.sellPoints.forEach((point) => {
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
          // 为每个点添加唯一ID，避免连线
          pointId: `sell_${point.orderNo || point.time}`
        });
      });
    }
    
    // 合并所有数据
    const chartData = [...priceData, ...avgPriceData, ...buyPointsData, ...sellPointsData];
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

  // 计算图表的Y轴范围
  const getYAxisConfig = () => {
    if (!chartData.length) return {};

    // 提取所有价格数据
    const values = chartData.map(item => item.value);
    const minValue = Math.min(...values) * 0.995; // 稍微减小最小值
    const maxValue = Math.max(...values) * 1.005; // 稍微增大最大值

    return {
      min: minValue,
      max: maxValue,
      tickCount: 5, // 减少Y轴刻度数量
    };
  };

  // 渲染图表
  const renderStockChart = () => {
    if (!chartData.length) return null;
    
    // 不再需要提取买入和卖出点
    const config = {
      data: chartData,
      xField: 'time',
      yField: 'value',
      seriesField: 'type',
      // 将买入点和卖出点分组到不同的类别，防止连线
      colorField: 'pointId',
      color: (datum: any) => {
        if (datum.type === intl.formatMessage({ id: 'pages.stockChart.currentPrice' })) {
          return '#1890ff';
        }
        if (datum.type === intl.formatMessage({ id: 'pages.stockChart.avgPrice' })) {
          return '#faad14';
        }
        if (datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' })) {
          return '#f5222d';
        }
        if (datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' })) {
          return '#52c41a';
        }
        return '#808080';
      },
      // 确保点和线条的样式
      lineStyle: (datum: any) => {
        if (datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) || 
            datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' })) {
          return {
            opacity: 0, // 隐藏买入和卖出点之间的连线
          };
        }
        return {
          lineWidth: 2,
        };
      },
      point: {
        shape: (datum: any) => {
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' })) {
            return 'diamond';
          }
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' })) {
            return 'square';
          }
          // 为当前价和均价使用小圆点
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.currentPrice' }) ||
              datum.type === intl.formatMessage({ id: 'pages.stockChart.avgPrice' })) {
            return 'circle';
          }
          return ''; // 其他数据点不显示为点
        },
        style: (datum: any) => {
          // 判断是否是买入点或卖出点，并且有账户名或额外信息
          const hasBuyInfo = datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) && 
                            (datum.accountName || datum.extra);
          const hasSellInfo = datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' }) && 
                             (datum.accountName || datum.extra);
          
          if (hasBuyInfo) {
            return {
              fill: '#f5222d',
              r: 6, // 更大的点
              lineWidth: 3,
              stroke: '#f5222d',
              strokeOpacity: 0.8,
              fillOpacity: 0.8,
            };
          }
          if (hasSellInfo) {
            return {
              fill: '#52c41a',
              r: 6, // 更大的点
              lineWidth: 3,
              stroke: '#52c41a',
              strokeOpacity: 0.8,
              fillOpacity: 0.8,
            };
          }
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' })) {
            return {
              fill: '#f5222d',
              r: 4,
              lineWidth: 2,
              stroke: '#f5222d',
            };
          }
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' })) {
            return {
              fill: '#52c41a',
              r: 4,
              lineWidth: 2,
              stroke: '#52c41a',
            };
          }
          // 设置当前价和均价点的样式，使其小而不明显
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.currentPrice' })) {
            return {
              fill: '#1890ff',
              r: 1.5,
              lineWidth: 0,
              opacity: 0.6,
            };
          }
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.avgPrice' })) {
            return {
              fill: '#faad14',
              r: 1.5,
              lineWidth: 0,
              opacity: 0.6,
            };
          }
          return {
            opacity: 0, // 隐藏其他点
          };
        },
        size: (datum: any) => {
          // 判断是否是买入点或卖出点，并且有账户名或额外信息
          const hasBuyInfo = datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) && 
                            (datum.accountName || datum.extra);
          const hasSellInfo = datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' }) && 
                             (datum.accountName || datum.extra);
                             
          if (hasBuyInfo || hasSellInfo) {
            return 10; // 带有账户名或额外信息的点更大一些
          }
          
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) ||
              datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' })) {
            return 8; // 买入卖出点大小保持不变
          }
          return 3; // 价格线和均价线上的点设置为较小的尺寸
        },
        label: {
          // 为买入点和卖出点添加标签显示
          layout: [
            {
              type: 'hide-overlap',
            },
          ],
          // 配置文本标签的显示样式
          style: (datum: any) => {
            // 根据买入点或卖出点设置不同颜色的标签
            const isBuyPoint = datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' });
            const textColor = isBuyPoint ? '#f5222d' : '#52c41a';
            
            return {
              textAlign: 'center',
              fill: textColor,
              fontSize: 10,
              fontWeight: 'bold',
              textBaseline: isBuyPoint ? 'bottom' : 'top',
              shadowColor: 'rgba(255, 255, 255, 0.8)',
              shadowBlur: 2,
            };
          },
          // 根据点的类型设置标签的位置
          offsetY: (datum: any) => {
            return datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) ? -15 : 15;
          },
          formatter: (datum: any) => {
            // 只为买卖点且带有账户信息的数据点添加标签
            if ((datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) || 
                datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' })) && 
                (datum.accountName || datum.extra)) {
              
              let content = '';
              if (datum.accountName) content += datum.accountName;
              if (datum.extra) content += content ? `(${datum.extra})` : datum.extra;
              
              return content;
            }
            return '';
          },
        },
      },
      tooltip: {
        showMarkers: true,
        shared: true,
        showCrosshairs: true,
        crosshairs: {
          type: 'xy' as const,
        },
        formatter: (datum: any) => {
          const type = datum.type;
          const value = datum.value.toFixed(2);
          
          if (type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) || 
              type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' })) {
            
            if (datum.orderNo) {
              // 构建包含账户名和额外信息的tooltip内容
              let tooltipContent = `${value} (${intl.formatMessage({ id: 'pages.stockChart.orderNo' })}: ${datum.orderNo})\n` +
                        `${intl.formatMessage({ id: 'pages.stockChart.quantity' })}: ${datum.fillQty || datum.number}\n` +
                        `${intl.formatMessage({ id: 'pages.stockChart.time' })}: ${datum.rawTime}`;
              
              // 添加账户名信息，放在开头并用星号标记，确保显著
              if (datum.accountName) {
                tooltipContent = `★ ${intl.formatMessage({ id: 'pages.stockChart.account' })}: ${datum.accountName} ★\n` + tooltipContent;
              }
              
              // 添加额外信息，放在账户名后面
              if (datum.extra) {
                tooltipContent = `★ ${intl.formatMessage({ id: 'pages.stockChart.extra' })}: ${datum.extra} ★\n` + tooltipContent;
              }
              
              return {
                name: type,
                value: tooltipContent
              };
            }
          }
          
          return {
            name: type,
            value: value,
          };
        },
      },
      legend: {
        position: 'top' as const,
        filter: (type: string) => {
          // 只在图例中显示主要类型，不显示每个买入卖出点的单独图例
          return type === intl.formatMessage({ id: 'pages.stockChart.currentPrice' }) ||
                 type === intl.formatMessage({ id: 'pages.stockChart.avgPrice' }) ||
                 type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) ||
                 type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' });
        }
      },
      yAxis: {
        title: {
          text: intl.formatMessage({ id: 'pages.stockChart.price' }),
        },
        grid: {
          line: {
            style: {
              stroke: '#d9d9d9',
              lineWidth: 0.5,
              lineDash: [4, 5],
              strokeOpacity: 0.7,
            },
          },
        },
        ...getYAxisConfig(),
      },
      xAxis: {
        title: {
          text: intl.formatMessage({ id: 'pages.stockChart.time' }),
        },
        tickCount: 8,
        label: {
          autoRotate: true,
          autoHide: true,
          formatter: (text: string) => {
            const parts = text.split(' ');
            return parts.length > 1 ? parts[1] : text;
          },
        },
        // 确保X轴刻度线适配整个图表宽度
        nice: true,
        // 增加X轴的范围，确保数据不会被截断
        range: [0, 0.98],
      },
      // 调整padding，减小右侧padding确保数据能完全显示
      padding: [30, 40, 30, 40],
      animation: {
        appear: {
          duration: 1000,
        },
      },
      // 增加自动适配
      autoFit: true,
      // 确保图表可以响应容器大小变化
      responsive: true,
    };
    
    return (
      <div style={{ width: '100%', overflow: 'hidden' }}>
        <Line {...config} height={380} />
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