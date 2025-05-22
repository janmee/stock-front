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
  Tag
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { useIntl, FormattedMessage } from '@umijs/max';
import moment from 'moment';
import { PageContainer } from '@ant-design/pro-layout';
import { getStockMinuteData } from '@/services/ant-design-pro/api';

const StockChart: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState<boolean>(false);
  const [stockCode, setStockCode] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [stockChartData, setStockChartData] = useState<API.StockMinuteVO | null>(null);
  const [days, setDays] = useState<number>(1); // 默认1天
  const formRef = useRef<any>();

  // 常用股票列表
  const popularStocks = [
    { code: 'TSLA', name: 'Tesla' },
    { code: 'PLTR', name: 'Palantir' },
    { code: 'CRWD', name: 'CrowdStrike' },
    { code: 'AAPL', name: 'Apple' },
    { code: 'MSFT', name: 'Microsoft' },
    { code: 'AMZN', name: 'Amazon' },
    { code: 'GOOGL', name: 'Google' },
    { code: 'NVDA', name: 'NVIDIA' },
  ];

  // 处理股票标签点击
  const handleStockTagClick = (code: string) => {
    // 设置表单字段值
    formRef.current?.setFieldsValue({ stockCode: code });
    setStockCode(code);
    // 立即触发搜索
    fetchStockMinuteData(code, days);
  };

  const fetchStockMinuteData = async (code: string, selectedDays: number) => {
    if (!code) {
      message.error(intl.formatMessage({ id: 'pages.stockChart.stockCodeRequired' }));
      return;
    }
    
    setLoading(true);
    try {
      const response = await getStockMinuteData(code, selectedDays);
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

  const transformDataForChart = (data: API.StockMinuteVO) => {
    // 分开存储不同类型的数据
    const priceData: any[] = [];
    const avgPriceData: any[] = [];
    const buyPointsData: any[] = [];
    const sellPointsData: any[] = [];
    
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
      fetchStockMinuteData(values.stockCode.toUpperCase(), days);
    }
  };

  const handleRefresh = () => {
    if (stockCode) {
      fetchStockMinuteData(stockCode, days);
    }
  };

  const handleDaysChange = (e: any) => {
    const selectedDays = e.target.value;
    setDays(selectedDays);
    if (stockCode) {
      fetchStockMinuteData(stockCode, selectedDays);
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
          if (datum.type === intl.formatMessage({ id: 'pages.stockChart.buyPoint' }) ||
              datum.type === intl.formatMessage({ id: 'pages.stockChart.sellPoint' })) {
            return 8; // 买入卖出点大小保持不变
          }
          return 3; // 价格线和均价线上的点设置为较小的尺寸
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
              return {
                name: type,
                value: `${value} (${intl.formatMessage({ id: 'pages.stockChart.orderNo' })}: ${datum.orderNo})\n` +
                      `${intl.formatMessage({ id: 'pages.stockChart.quantity' })}: ${datum.fillQty || datum.number}\n` +
                      `${intl.formatMessage({ id: 'pages.stockChart.time' })}: ${datum.rawTime}`
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
            valueStyle={{ color: (totalProfit || 0) >= 0 ? '#3f8600' : '#cf1322' }}
            style={{ marginBottom: 0 }}
          />
        </Col>
        <Col span={3}>
          <Statistic
            title="盈利百分比"
            value={totalProfitPercentage || 0}
            precision={2}
            suffix="%"
            valueStyle={{ color: (totalProfitPercentage || 0) >= 0 ? '#3f8600' : '#cf1322' }}
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
                      style={{ marginBottom: 0 }} // 减小统计数据的下边距
                    />
                  </Col>
                  <Col span={3}>
                    <Statistic
                      title="涨跌幅"
                      value={getLatestPercentage() || 0}
                      precision={2}
                      valueStyle={{ color: (getLatestPercentage() || 0) >= 0 ? '#3f8600' : '#cf1322' }}
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