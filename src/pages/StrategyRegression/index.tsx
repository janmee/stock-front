import React, { useState } from 'react';
import { Card, Form, Input, Button, Table, Statistic, Row, Col, message, Spin, Tabs, Select } from 'antd';
import { Line } from '@ant-design/charts';
import { runStrategyRegression, runRegressionByStrategy } from '@/services/ant-design-pro/api';
import moment from 'moment';
import type { AxiosError } from 'axios';

const { TabPane } = Tabs;
const { Option } = Select;

interface ErrorResponse {
  message?: string;
  error?: string;
}

interface SimulatedOrder {
  stockCode: string;
  price: number;
  quantity: number;
  orderTime: string;
  orderType: string; // BUY, SELL
  targetPrice?: number;
  closed: boolean;
  closeTime?: string;
  closePrice?: number;
  profit?: number;
  profitRate?: number;
  holdingTimeMinutes?: number;
  dataPointIndex: number;
}

interface DayRegressionResult {
  date: string;
  stockCode: string;
  meetsCriteria: boolean;
  buyOrders: SimulatedOrder[];
  sellOrders: SimulatedOrder[];
  minuteData: any[];
  success: boolean;
}

interface RegressionResult {
  stockCode: string;
  totalDays: number;
  daysWithBuyPoints: number;
  successDays: number;
  successRate: number;
  avgHoldingTime: number;
  totalBuyPoints: number;
  totalSellPoints: number;
  dailyResults: DayRegressionResult[];
  indexData: any;
}

// 预定义的策略列表
const strategyOptions = [
  { value: 'online.mwang.stockTrading.web.service.strategy.impl.BounceAboveHighOscillationStrategy', label: '反弹上方高位震荡策略' },
  { value: 'online.mwang.stockTrading.web.service.strategy.impl.MACrossOverStrategy', label: '均线交叉策略' },
  // 可以继续添加更多策略
];

const StrategyRegression: React.FC = () => {
  const [form] = Form.useForm();
  const [strategyForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [regressionData, setRegressionData] = useState<RegressionResult | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [indexChartData, setIndexChartData] = useState<any[]>([]);
  const [allIndexData, setAllIndexData] = useState<any>(null);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const response = await runStrategyRegression(
        values.stockCode,
        values.strategyId,
        values.strategyClassName,
        parseFloat(values.sellProfitPercentage),
        parseInt(values.dayCount, 10),
        parseFloat(values.initialFunds),
      );
      handleRegressionResponse(response);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const onStrategyFinish = async (values: any) => {
    try {
      setLoading(true);
      const response = await runRegressionByStrategy(
        values.strategyId,
        parseFloat(values.sellProfitPercentage),
        parseInt(values.dayCount, 10),
        parseFloat(values.initialFunds),
      );
      handleRegressionResponse(response);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegressionResponse = (response: any) => {
    if (response.success) {
      const result = response.data as RegressionResult;
      
      // 保存所有日期的指数数据
      setAllIndexData(result.indexData || {});
      
      // 如果有日期数据，默认显示第一天的指数数据
      const dailyResults = result.dailyResults || [];
      if (dailyResults.length > 0) {
        const firstDate = moment(dailyResults[0].date).format('YYYY-MM-DD');
        if (result.indexData && result.indexData[firstDate]) {
          updateIndexChartData(firstDate, result.indexData[firstDate]);
        }
        
        setSelectedDate(firstDate);
        updateChartData(dailyResults[0]);
      }
      
      setRegressionData(result);
      message.success('策略回归测试完成');
    } else {
      message.error(response.errorMessage || '策略回归测试失败');
    }
  };

  const handleError = (error: any) => {
    const err = error as AxiosError<ErrorResponse>;
    message.error(
      err.response?.data?.message || 
      err.response?.data?.error || 
      err.message || 
      '策略回归测试失败'
    );
  };

  const updateChartData = (dailyResult: DayRegressionResult) => {
    if (!dailyResult) return;
    
    const data: any[] = [];
    
    // 添加分时数据
    if (dailyResult.minuteData) {
      dailyResult.minuteData.forEach((item: any) => {
        data.push({
          time: moment(item.timestamp).format('HH:mm'),
          value: item.current,
          type: '当前价'
        });
        
        data.push({
          time: moment(item.timestamp).format('HH:mm'),
          value: item.avgPrice,
          type: '均价'
        });
      });
    }
    
    // 添加买入点
    if (dailyResult.buyOrders) {
      dailyResult.buyOrders.forEach((order: SimulatedOrder) => {
        const timeIndex = moment(order.orderTime).format('HH:mm');
        data.push({
          time: timeIndex,
          value: order.price,
          type: '买入点'
        });
      });
    }
    
    // 添加卖出点
    if (dailyResult.sellOrders) {
      dailyResult.sellOrders.forEach((order: SimulatedOrder) => {
        const timeIndex = moment(order.orderTime).format('HH:mm');
        data.push({
          time: timeIndex,
          value: order.price,
          type: '卖出点'
        });
      });
    }
    
    setChartData(data);
  };
  
  const updateIndexChartData = (date: string, dailyIndexData: any) => {
    const newIndexChartData: any[] = [];
    
    // 处理纳斯达克指数数据
    if (dailyIndexData?.nasdaq) {
      dailyIndexData.nasdaq.forEach((item: any) => {
        newIndexChartData.push({
          time: moment(item.timestamp).format('HH:mm'),
          value: item.change,
          type: '纳斯达克指数'
        });
      });
    }
    
    // 处理标普500指数数据
    if (dailyIndexData?.spx) {
      dailyIndexData.spx.forEach((item: any) => {
        newIndexChartData.push({
          time: moment(item.timestamp).format('HH:mm'),
          value: item.change,
          type: '标普500指数'
        });
      });
    }
    
    setIndexChartData(newIndexChartData);
  };

  const handleDetailClick = (record: DayRegressionResult) => {
    setSelectedDate(moment(record.date).format('YYYY-MM-DD'));
    updateChartData(record);
    
    // 更新指数数据
    const dateStr = moment(record.date).format('YYYY-MM-DD');
    if (allIndexData && allIndexData[dateStr]) {
      updateIndexChartData(dateStr, allIndexData[dateStr]);
    }
  };

  // 表格列配置
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => moment(date).format('YYYY-MM-DD'),
    },
    {
      title: '是否有买入点',
      dataIndex: 'hasBuyPoint',
      key: 'hasBuyPoint',
      render: (_: any, record: DayRegressionResult) => {
        const hasBuyPoints = record.buyOrders && record.buyOrders.length > 0;
        return hasBuyPoints ? '是' : '否';
      },
    },
    {
      title: '买入时间',
      dataIndex: 'buyTime',
      key: 'buyTime',
      render: (_: any, record: DayRegressionResult) => {
        if (record.buyOrders && record.buyOrders.length > 0) {
          return moment(record.buyOrders[0].orderTime).format('HH:mm');
        }
        return '-';
      },
    },
    {
      title: '是否当天卖出',
      dataIndex: 'hasSoldSameDay',
      key: 'hasSoldSameDay',
      render: (_: any, record: DayRegressionResult) => {
        if (!record.buyOrders || record.buyOrders.length === 0) return '-';
        const hasSellPoints = record.sellOrders && record.sellOrders.length > 0;
        return hasSellPoints ? '是' : '否';
      },
    },
    {
      title: '卖出时间',
      dataIndex: 'sellTime',
      key: 'sellTime',
      render: (_: any, record: DayRegressionResult) => {
        if (record.sellOrders && record.sellOrders.length > 0) {
          return moment(record.sellOrders[0].orderTime).format('HH:mm');
        }
        return '-';
      },
    },
    {
      title: '持仓时间',
      dataIndex: 'holdingTime',
      key: 'holdingTime',
      render: (_: any, record: DayRegressionResult) => {
        if (record.sellOrders && record.sellOrders.length > 0 && record.sellOrders[0].holdingTimeMinutes) {
          return `${record.sellOrders[0].holdingTimeMinutes} 分钟`;
        }
        return '-';
      },
    },
    {
      title: '盈利率',
      dataIndex: 'profitRate',
      key: 'profitRate',
      render: (_: any, record: DayRegressionResult) => {
        if (record.sellOrders && record.sellOrders.length > 0 && record.sellOrders[0].profitRate) {
          return `${record.sellOrders[0].profitRate.toFixed(2)}%`;
        }
        return '-';
      },
    },
    {
      title: '交易结果',
      dataIndex: 'success',
      key: 'success',
      render: (success: boolean, record: DayRegressionResult) => {
        if (!record.buyOrders || record.buyOrders.length === 0) return '-';
        return success ? '成功' : '失败';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: DayRegressionResult) => (
        <Button type="link" onClick={() => handleDetailClick(record)}>
          查看详情
        </Button>
      ),
    },
  ];

  const getChartTitle = () => {
    if (!regressionData) return '股票价格走势';
    return `${regressionData.stockCode} 价格走势 (${selectedDate})`;
  };

  const getIndexChartTitle = () => {
    return `指数涨跌幅 (${selectedDate})`;
  };

  const chartConfig = {
    data: chartData,
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    point: {
      size: 5,
      shape: 'circle',
      style: ({ type }: { type: string }) => {
        if (type === '买入点') {
          return { fill: 'red', r: 5, lineWidth: 2 };
        }
        if (type === '卖出点') {
          return { fill: 'green', r: 5, lineWidth: 2 };
        }
        return { r: 0 };
      },
    },
    color: ({ type }: { type: string }) => {
      if (type === '当前价') return '#1890ff';
      if (type === '均价') return '#faad14';
      if (type === '买入点') return 'red';
      if (type === '卖出点') return 'green';
      return '#1890ff';
    },
  };

  const indexChartConfig = {
    data: indexChartData,
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    color: ({ type }: { type: string }) => {
      if (type === '纳斯达克指数') return '#1890ff';
      if (type === '标普500指数') return '#faad14';
      return '#1890ff';
    },
  };

  return (
    <div style={{ padding: 24 }}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="股票策略回归" key="1">
          <Card title="策略回归参数设置" style={{ marginBottom: 24 }}>
            <Form
              form={form}
              name="strategy_regression"
              onFinish={onFinish}
              layout="inline"
              initialValues={{
                stockCode: 'AAPL',
                sellProfitPercentage: '1.5',
                dayCount: '10',
                initialFunds: '100000'
              }}
            >
              <Form.Item
                name="stockCode"
                label="股票代码"
                rules={[{ required: true, message: '请输入股票代码' }]}
              >
                <Input style={{ width: 120 }} placeholder="如：AAPL" />
              </Form.Item>
              
              <Form.Item
                name="strategyClassName"
                label="策略类型"
              >
                <Select style={{ width: 240 }} placeholder="请选择策略类型">
                  {strategyOptions.map(option => (
                    <Option key={option.value} value={option.value}>{option.label}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item
                name="sellProfitPercentage"
                label="卖出盈利百分比"
                rules={[{ required: true, message: '请输入卖出盈利百分比' }]}
              >
                <Input style={{ width: 80 }} placeholder="1.5" />
              </Form.Item>
              
              <Form.Item
                name="dayCount"
                label="回测天数"
                rules={[{ required: true, message: '请输入回测天数' }]}
              >
                <Input style={{ width: 80 }} placeholder="10" />
              </Form.Item>
              
              <Form.Item
                name="initialFunds"
                label="初始资金"
                rules={[{ required: true, message: '请输入初始资金' }]}
              >
                <Input style={{ width: 100 }} placeholder="100000" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  执行回归测试
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        <TabPane tab="策略ID回归" key="2">
          <Card title="策略ID回归参数设置" style={{ marginBottom: 24 }}>
            <Form
              form={strategyForm}
              name="strategy_id_regression"
              onFinish={onStrategyFinish}
              layout="inline"
              initialValues={{
                strategyId: '',
                sellProfitPercentage: '1.5',
                dayCount: '10',
                initialFunds: '100000'
              }}
            >
              <Form.Item
                name="strategyId"
                label="策略ID"
                rules={[{ required: true, message: '请输入策略ID' }]}
              >
                <Input style={{ width: 120 }} placeholder="如：1" />
              </Form.Item>
              
              <Form.Item
                name="sellProfitPercentage"
                label="卖出盈利百分比"
                rules={[{ required: true, message: '请输入卖出盈利百分比' }]}
              >
                <Input style={{ width: 80 }} placeholder="1.5" />
              </Form.Item>
              
              <Form.Item
                name="dayCount"
                label="回测天数"
                rules={[{ required: true, message: '请输入回测天数' }]}
              >
                <Input style={{ width: 80 }} placeholder="10" />
              </Form.Item>
              
              <Form.Item
                name="initialFunds"
                label="初始资金"
                rules={[{ required: true, message: '请输入初始资金' }]}
              >
                <Input style={{ width: 100 }} placeholder="100000" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  执行回归测试
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
      </Tabs>
      
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: 100 }}>
          <Spin size="large" tip="正在执行回归测试..." />
        </div>
      ) : regressionData ? (
        <>
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={4}>
              <Card>
                <Statistic
                  title="股票代码"
                  value={regressionData.stockCode}
                  precision={0}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="总交易天数"
                  value={regressionData.totalDays}
                  precision={0}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="有买入点天数"
                  value={regressionData.daysWithBuyPoints}
                  precision={0}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="成功交易天数"
                  value={regressionData.successDays}
                  precision={0}
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="成功率"
                  value={regressionData.successRate}
                  precision={2}
                  suffix="%"
                />
              </Card>
            </Col>
            <Col span={4}>
              <Card>
                <Statistic
                  title="平均持仓时间"
                  value={regressionData.avgHoldingTime}
                  precision={0}
                  suffix="分钟"
                />
              </Card>
            </Col>
          </Row>
          
          <Row gutter={24} style={{ marginBottom: 24 }}>
            <Col span={12}>
              <Card title={getChartTitle()}>
                <Line {...chartConfig} />
              </Card>
            </Col>
            <Col span={12}>
              <Card title={getIndexChartTitle()}>
                <Line {...indexChartConfig} />
              </Card>
            </Col>
          </Row>
          
          <Card title="每日交易详情">
            <Table
              dataSource={regressionData.dailyResults}
              columns={columns}
              rowKey={(record) => record.date}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
};

export default StrategyRegression; 