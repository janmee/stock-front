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
        setRegressionData(response.data);
        
        // 默认选择第一天
        if (response.data.dailyResults && response.data.dailyResults.length > 0) {
          setSelectedDate(response.data.dailyResults[0].date);
          updateChartData(response.data.dailyResults[0]);
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
    if (dailyResult.buyPoints) {
      dailyResult.buyPoints.forEach((point: any) => {
        data.push({
          time: moment(point.time).format('HH:mm'),
          value: point.price,
          type: '买入点',
        });
      });
    }
    
    // 添加卖出点
    if (dailyResult.sellPoints) {
      dailyResult.sellPoints.forEach((point: any) => {
        data.push({
          time: moment(point.time).format('HH:mm'),
          value: point.price,
          type: '卖出点',
        });
      });
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
      title: '满足条件',
      dataIndex: 'meetsCriteria',
      key: 'meetsCriteria',
      render: (text: boolean) => (text ? '是' : '否'),
    },
    {
      title: '买入点数量',
      dataIndex: 'buyPoints',
      key: 'buyPoints',
      render: (buyPoints: any[]) => buyPoints.length,
    },
    {
      title: '卖出点数量',
      dataIndex: 'sellPoints',
      key: 'sellPoints',
      render: (sellPoints: any[]) => sellPoints.length,
    },
    {
      title: '是否成功',
      dataIndex: 'success',
      key: 'success',
      render: (text: boolean) => (text ? '是' : '否'),
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
      <Card title="实时策略回归测试">
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
                    title="测试天数"
                    value={regressionData.totalDays}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="成功天数"
                    value={regressionData.successDays}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="成功率"
                    value={regressionData.successRate}
                    precision={2}
                    suffix="%"
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title="总买入点"
                    value={regressionData.totalBuyPoints}
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