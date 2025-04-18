import React, { useState } from 'react';
import { Card, Form, Input, Button, Table, Statistic, Row, Col, message, Spin } from 'antd';
import { Line } from '@ant-design/charts';
import { runRealtimeRegression } from '@/services/ant-design-pro/api';
import moment from 'moment';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
  error?: string;
}

interface DailyResult {
  date: string;
  buyPoints?: { time: string; price: number }[];
  sellPoints?: { time: string; price: number }[];
  minuteData?: any[];
}

const RealtimeRegression: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [regressionData, setRegressionData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const response = await runRealtimeRegression(
        values.stockCode,
        parseFloat(values.sellProfitPercentage),
        {}
      );
      if (response.success) {
        // 计算正确的成功率
        const dailyResults = (response.data.dailyResults || []) as DailyResult[];
        const tradingDays = dailyResults.filter((day: DailyResult) => day.buyPoints && day.buyPoints.length > 0).length;
        const successDays = dailyResults.filter((day: DailyResult) => 
          day.buyPoints && 
          day.buyPoints.length > 0 && 
          day.sellPoints && 
          day.sellPoints.length > 0
        ).length;
        
        const successRate = tradingDays > 0 ? (successDays / tradingDays * 100) : 0;

        // 计算平均持仓时间（分钟）
        let totalHoldingTime = 0;
        let completedTradeCount = 0;
        
        dailyResults.forEach((day: DailyResult) => {
          console.log('Processing day:', day.date);
          console.log('Buy points:', day.buyPoints);
          console.log('Sell points:', day.sellPoints);
          
          if (day.buyPoints && day.buyPoints.length > 0 && day.sellPoints && day.sellPoints.length > 0) {
            const buyTimeStr = day.buyPoints[0].time;
            const sellTimeStr = day.sellPoints[0].time;
            
            // 检查时间格式
            console.log('Raw buy time:', buyTimeStr);
            console.log('Raw sell time:', sellTimeStr);
            
            // 尝试解析时间戳格式
            let buyDateTime, sellDateTime;
            
            if (buyTimeStr.length > 5) { // 如果是时间戳格式
              buyDateTime = moment(buyTimeStr);
              sellDateTime = moment(sellTimeStr);
            } else { // 如果是 HH:mm 格式
              buyDateTime = moment(day.date + ' ' + buyTimeStr, 'YYYY-MM-DD HH:mm');
              sellDateTime = moment(day.date + ' ' + sellTimeStr, 'YYYY-MM-DD HH:mm');
            }
            
            console.log('Parsed buy time:', buyDateTime.format('YYYY-MM-DD HH:mm:ss'));
            console.log('Parsed sell time:', sellDateTime.format('YYYY-MM-DD HH:mm:ss'));
            
            if (buyDateTime.isValid() && sellDateTime.isValid()) {
              const holdingTime = sellDateTime.diff(buyDateTime, 'minutes');
              console.log('Calculated holding time:', holdingTime);
              
              if (holdingTime > 0) {
                totalHoldingTime += holdingTime;
                completedTradeCount++;
                console.log('Added to total. Current total:', totalHoldingTime);
                console.log('Trade count:', completedTradeCount);
              } else {
                console.log('Invalid holding time (<=0):', holdingTime);
              }
            } else {
              console.log('Invalid datetime parsing');
            }
          }
        });

        console.log('Final total holding time:', totalHoldingTime);
        console.log('Final completed trades:', completedTradeCount);
        
        const avgHoldingTime = completedTradeCount > 0 ? Math.round(totalHoldingTime / completedTradeCount) : 0;
        console.log('Final average holding time:', avgHoldingTime);
        
        setRegressionData({
          ...response.data,
          totalTradingDays: tradingDays,
          successDays: successDays,
          successRate: successRate,
          avgHoldingTime: avgHoldingTime
        });
        
        // 默认选择第一天
        if (dailyResults && dailyResults.length > 0) {
          setSelectedDate(dailyResults[0].date);
          updateChartData(dailyResults[0]);
        }
        
        message.success('回归测试完成');
      } else {
        message.error(response.errorMessage || '回归测试失败');
      }
    } catch (error) {
      const err = error as AxiosError<ErrorResponse>;
      message.error(
        err.response?.data?.message || 
        err.response?.data?.error || 
        err.message || 
        '回归测试失败'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateChartData = (dailyResult: any) => {
    if (!dailyResult) return;
    
    const data: any[] = [];
    
    // 添加分钟数据
    if (dailyResult.minuteData) {
      dailyResult.minuteData.forEach((item: any) => {
        // 添加当前价格数据
        data.push({
          time: moment(item.timestamp).format('HH:mm'),
          value: item.current,
          type: '当前价',
        });
        
        // 添加均价数据
        data.push({
          time: moment(item.timestamp).format('HH:mm'),
          value: item.avgPrice,
          type: '均价',
        });
      });
    }
    
    // 添加买入点
    if (dailyResult.buyPoints && dailyResult.buyPoints.length > 0) {
      dailyResult.buyPoints.forEach((point: any) => {
        data.push({
          time: moment(point.time).format('HH:mm'),
          value: point.price,
          type: '买入点',
        });
      });
      // 更新表格中的买入状态
      dailyResult.hasBuyPoint = true;
      dailyResult.buyTime = moment(dailyResult.buyPoints[0].time).format('HH:mm');
    }
    
    // 添加卖出点
    if (dailyResult.sellPoints && dailyResult.sellPoints.length > 0) {
      dailyResult.sellPoints.forEach((point: any) => {
        data.push({
          time: moment(point.time).format('HH:mm'),
          value: point.price,
          type: '卖出点',
        });
      });
      // 更新表格中的卖出状态
      dailyResult.hasSoldSameDay = true;
      dailyResult.sellTime = moment(dailyResult.sellPoints[0].time).format('HH:mm');
    }
    
    setChartData(data);
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '是否有买入点',
      dataIndex: 'hasBuyPoint',
      key: 'hasBuyPoint',
      render: (text: boolean, record: any) => {
        const hasBuyPoints = record.buyPoints && record.buyPoints.length > 0;
        return hasBuyPoints ? '是' : '否';
      },
    },
    {
      title: '买入时间',
      dataIndex: 'buyTime',
      key: 'buyTime',
      render: (text: string, record: any) => {
        if (record.buyPoints && record.buyPoints.length > 0) {
          return moment(record.buyPoints[0].time).format('HH:mm');
        }
        return '-';
      },
    },
    {
      title: '是否当天卖出',
      dataIndex: 'hasSoldSameDay',
      key: 'hasSoldSameDay',
      render: (text: boolean, record: any) => {
        if (!record.buyPoints || record.buyPoints.length === 0) return '-';
        const hasSellPoints = record.sellPoints && record.sellPoints.length > 0;
        return hasSellPoints ? '是' : '否';
      },
    },
    {
      title: '卖出时间',
      dataIndex: 'sellTime',
      key: 'sellTime',
      render: (text: string, record: any) => {
        if (record.sellPoints && record.sellPoints.length > 0) {
          return moment(record.sellPoints[0].time).format('HH:mm');
        }
        return '-';
      },
    },
    {
      title: '持仓时间',
      dataIndex: 'holdingTime',
      key: 'holdingTime',
      render: (text: string, record: any) => {
        if (record.buyPoints && record.buyPoints.length > 0 && record.sellPoints && record.sellPoints.length > 0) {
          const buyTimeStr = record.buyPoints[0].time;
          const sellTimeStr = record.sellPoints[0].time;
          
          let buyDateTime, sellDateTime;
          if (buyTimeStr.length > 5) {
            buyDateTime = moment(buyTimeStr);
            sellDateTime = moment(sellTimeStr);
          } else {
            buyDateTime = moment(record.date + ' ' + buyTimeStr, 'YYYY-MM-DD HH:mm');
            sellDateTime = moment(record.date + ' ' + sellTimeStr, 'YYYY-MM-DD HH:mm');
          }
          
          if (buyDateTime.isValid() && sellDateTime.isValid()) {
            const holdingTime = sellDateTime.diff(buyDateTime, 'minutes');
            if (holdingTime > 0) {
              return `${holdingTime} 分钟`;
            }
          }
        }
        return '-';
      },
    },
    {
      title: '交易结果',
      dataIndex: 'success',
      key: 'success',
      render: (text: boolean, record: any) => {
        if (!record.buyPoints || record.buyPoints.length === 0) return '-';
        const hasSellPoints = record.sellPoints && record.sellPoints.length > 0;
        return hasSellPoints ? '成功' : '失败';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => {
          setSelectedDate(record.date);
          updateChartData(record);
        }}>
          查看详情
        </Button>
      ),
    },
  ];

  const config = {
    data: chartData,
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    yAxis: {
      title: {
        text: '价格',
      },
      min: (min: number) => min * 0.995, // 设置y轴最小值略小于数据最小值
      max: (max: number) => max * 1.005, // 设置y轴最大值略大于数据最大值
    },
    xAxis: {
      title: {
        text: '时间',
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
        return {
          name: datum.type,
          value: datum.value.toFixed(2),
        };
      },
    },
    legend: {
      position: 'top' as const,
    },
    point: {
      shape: (datum: any) => {
        if (datum.type === '买入点') return 'diamond';
        if (datum.type === '卖出点') return 'square';
        return 'circle';
      },
      size: (datum: any) => {
        if (datum.type === '买入点' || datum.type === '卖出点') return 8;
        return 2;
      },
      style: (datum: any) => {
        if (datum.type === '买入点') {
          return { fill: '#52c41a', stroke: '#52c41a' };
        }
        if (datum.type === '卖出点') {
          return { fill: '#f5222d', stroke: '#f5222d' };
        }
        return { opacity: 0.5 };
      },
    },
    color: ['#1890ff', '#faad14', '#52c41a', '#f5222d'],
  };

  return (
    <div>
      <Card title="分时平均线策略回归测试">
        <Form
          form={form}
          onFinish={onFinish}
          layout="inline"
        >
          <Form.Item
            name="stockCode"
            label="股票代码"
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input placeholder="例如: AAPL" />
          </Form.Item>
          <Form.Item
            name="sellProfitPercentage"
            label="卖出盈利比例(%)"
            initialValue={1.5}
          >
            <Input type="number" step={0.1} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              开始回归测试
            </Button>
          </Form.Item>
        </Form>

        {regressionData && (
          <>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="有买入点的天数"
                    value={regressionData.totalTradingDays}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="当天完成交易天数"
                    value={regressionData.successDays}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="当天交易成功率"
                    value={regressionData.successRate}
                    precision={2}
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="平均持仓时间"
                    value={regressionData.avgHoldingTime}
                    suffix="分钟"
                  />
                </Card>
              </Col>
            </Row>

            <Card title="每日测试结果" style={{ marginTop: 16 }}>
              <Table
                columns={columns}
                dataSource={regressionData.dailyResults}
                rowKey="date"
              />
            </Card>

            {selectedDate && (
              <Card title={`${selectedDate} 价格走势图`} style={{ marginTop: 16 }}>
                <Line {...config} />
              </Card>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default RealtimeRegression; 