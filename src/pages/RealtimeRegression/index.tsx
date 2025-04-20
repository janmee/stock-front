import React, { useState } from 'react';
import { Card, Form, Input, Button, Table, Statistic, Row, Col, message, Spin, Tabs } from 'antd';
import { Line } from '@ant-design/charts';
import { runRealtimeRegression, runMarketCapRegression } from '@/services/ant-design-pro/api';
import moment from 'moment';
import type { AxiosError } from 'axios';

interface ErrorResponse {
  message?: string;
  error?: string;
}

interface DailyData {
  date: string;
  buyPoints?: { time: string; price: number }[];
  sellPoints?: { time: string; price: number }[];
  minuteData?: any[];
}

interface StockResult {
  stockCode: string;
  dailyResults: DailyData[];
  totalBuyPoints?: number;
  totalSellPoints?: number;
}

interface DailyResult {
  date: string;
  stockCode?: string;
  buyPoints?: { time: string; price: number }[];
  sellPoints?: { time: string; price: number }[];
  minuteData?: any[];
  success?: boolean;
  successRate?: number;
  details?: DailyResult[];
}

const { TabPane } = Tabs;

const RealtimeRegression: React.FC = () => {
  const [form] = Form.useForm();
  const [marketCapForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [regressionData, setRegressionData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedStockCode, setSelectedStockCode] = useState<string>('');
  const [chartData, setChartData] = useState<any[]>([]);
  const [indexChartData, setIndexChartData] = useState<any[]>([]);
  const [allIndexData, setAllIndexData] = useState<any>(null);
  const [isMarketCapRegression, setIsMarketCapRegression] = useState(false);

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      setIsMarketCapRegression(false);
      const response = await runRealtimeRegression(
        values.stockCode,
        parseFloat(values.sellProfitPercentage),
        {}
      );
      handleRegressionResponse(response);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const onMarketCapFinish = async (values: any) => {
    try {
      setLoading(true);
      setIsMarketCapRegression(true);
      const response = await runMarketCapRegression(
        parseFloat(values.marketCap),
        parseFloat(values.sellProfitPercentage),
        {}
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
      // 检查是否是市值筛选回归测试的响应
      if (response.data.stockResults) {
        // 处理市值筛选回归测试的响应
        const stockResults = (response.data.stockResults || []) as StockResult[];
        const totalStocks = response.data.totalStocks || 0;
        const successStocks = response.data.successStocks || 0;
        
        // 保存所有日期的指数数据
        setAllIndexData(response.data.indexData || {});
        
        // 如果有日期数据，默认显示第一天的指数数据
        const dates = Object.keys(response.data.indexData || {});
        if (dates.length > 0) {
          const firstDate = dates[0];
          updateIndexChartData(firstDate, response.data.indexData[firstDate]);
        }
        
        // 处理指数数据
        const newIndexChartData: any[] = [];
        
        // 处理纳斯达克指数数据
        if (response.data.indexData?.nasdaq) {
          response.data.indexData.nasdaq.forEach((item: any) => {
            newIndexChartData.push({
              time: moment(item.timestamp).format('HH:mm'),
              value: item.change,
              type: '纳斯达克指数'
            });
          });
        }
        
        // 处理标普500指数数据
        if (response.data.indexData?.spx) {
          response.data.indexData.spx.forEach((item: any) => {
            newIndexChartData.push({
              time: moment(item.timestamp).format('HH:mm'),
              value: item.change,
              type: '标普500指数'
            });
          });
        }
        
        setIndexChartData(newIndexChartData);
        
        // 将每只股票的回归测试结果转换为表格需要的格式
        const dailyResults = stockResults.map((result: StockResult) => {
          const stockDailyResults = result.dailyResults || [];
          const stockCode = result.stockCode;
          
          // 计算每只股票的成功率
          const buyDays = stockDailyResults.filter((day: DailyData) => day.buyPoints && day.buyPoints.length > 0).length;
          const successDays = stockDailyResults.filter((day: DailyData) => 
            day.buyPoints && day.buyPoints.length > 0 && 
            day.sellPoints && day.sellPoints.length > 0
          ).length;
          const successRate = buyDays > 0 ? (successDays / buyDays * 100) : 0;
          
          return {
            date: stockCode,
            stockCode: stockCode,
            hasBuyPoint: buyDays > 0,
            hasSoldSameDay: successDays > 0,
            success: successDays > 0,
            successRate: successRate,
            details: stockDailyResults.map((day: DailyData) => ({
              date: day.date,
              stockCode: stockCode,
              buyPoints: day.buyPoints || [],
              sellPoints: day.sellPoints || [],
              minuteData: day.minuteData || []
            }))
          };
        });
        
        // 重新计算总体平均成功率
        const validStocks = stockResults.filter((result: StockResult) => 
          result.dailyResults.some((day: DailyData) => day.buyPoints && day.buyPoints.length > 0)
        ).length;
        const totalSuccessRate = stockResults.reduce((sum: number, result: StockResult) => {
          const buyDays = result.dailyResults.filter((day: DailyData) => day.buyPoints && day.buyPoints.length > 0).length;
          const successDays = result.dailyResults.filter((day: DailyData) => 
            day.buyPoints && day.buyPoints.length > 0 && 
            day.sellPoints && day.sellPoints.length > 0
          ).length;
          return sum + (buyDays > 0 ? (successDays / buyDays * 100) : 0);
        }, 0);
        const newAvgSuccessRate = validStocks > 0 ? totalSuccessRate / validStocks : 0;
        
        setRegressionData({
          totalTradingDays: totalStocks,
          successDays: successStocks,
          successRate: newAvgSuccessRate,
          avgHoldingTime: 0,
          dailyResults: dailyResults
        });
        
        message.success('市值筛选回归测试完成');
        return;
      }
      
      // 处理单只股票回归测试的响应
      const dailyResults = (response.data.dailyResults || []) as DailyResult[];
      const tradingDays = dailyResults.filter((day: DailyResult) => day.buyPoints && day.buyPoints.length > 0).length;
      const successDays = dailyResults.filter((day: DailyResult) => 
        day.buyPoints && 
        day.buyPoints.length > 0 && 
        day.sellPoints && 
        day.sellPoints.length > 0
      ).length;
      
      const successRate = tradingDays > 0 ? (successDays / tradingDays * 100) : 0;
      const avgHoldingTime = response.data.avgHoldingTime || 0;
      
      // 保存所有日期的指数数据
      setAllIndexData(response.data.indexData || {});
      
      // 如果有日期数据，默认显示第一天的指数数据
      if (dailyResults && dailyResults.length > 0) {
        const firstDate = dailyResults[0].date;
        if (response.data.indexData && response.data.indexData[firstDate]) {
          updateIndexChartData(firstDate, response.data.indexData[firstDate]);
        }
      }
      
      setRegressionData({
        ...response.data,
        totalTradingDays: tradingDays,
        successDays: successDays,
        successRate: successRate,
        avgHoldingTime: avgHoldingTime
      });
      
      if (dailyResults && dailyResults.length > 0) {
        setSelectedDate(dailyResults[0].date);
        updateChartData(dailyResults[0]);
      }
      
      message.success('回归测试完成');
    } else {
      message.error(response.errorMessage || '回归测试失败');
    }
  };

  const handleError = (error: any) => {
    const err = error as AxiosError<ErrorResponse>;
    message.error(
      err.response?.data?.message || 
      err.response?.data?.error || 
      err.message || 
      '回归测试失败'
    );
  };

  const updateChartData = (dailyResult: any) => {
    if (!dailyResult) return;
    
    const data: any[] = [];
    const stockCode = dailyResult.stockCode;
    
    // 添加分钟数据
    if (dailyResult.minuteData) {
      dailyResult.minuteData.forEach((item: any) => {
        data.push({
          time: moment(item.timestamp).format('HH:mm'),
          value: item.current,
          type: '当前价',
          stockCode: stockCode
        });
        
        data.push({
          time: moment(item.timestamp).format('HH:mm'),
          value: item.avgPrice,
          type: '均价',
          stockCode: stockCode
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
          stockCode: stockCode
        });
      });
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
          stockCode: stockCode
        });
      });
      dailyResult.hasSoldSameDay = true;
      dailyResult.sellTime = moment(dailyResult.sellPoints[0].time).format('HH:mm');
    }
    
    setChartData(data);
  };

  // 更新指数图表数据
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

  // 修改查看详情按钮的点击处理函数
  const handleDetailClick = (record: any, date: string) => {
    setSelectedStockCode(record.stockCode || '');
    setSelectedDate(date);
    if (record.details?.[0]) {
      updateChartData(record.details[0]);
    }
    // 更新指数数据
    if (allIndexData && allIndexData[date]) {
      updateIndexChartData(date, allIndexData[date]);
    }
  };

  // 单股回归的表格列配置
  const singleStockColumns = [
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
          const buyTime = new Date(record.buyPoints[0].time).getTime();
          const sellTime = new Date(record.sellPoints[0].time).getTime();
          const holdingTime = Math.floor((sellTime - buyTime) / (60 * 1000)); // 转换为分钟
          return holdingTime > 0 ? `${holdingTime} 分钟` : '-';
        }
        return '-';
      },
    },
    {
      title: '交易结果',
      dataIndex: 'success',
      key: 'success',
      render: (text: boolean, record: any) => {
        if (!record.hasBuyPoint) return '-';
        return text ? '成功' : '失败';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => {
          setSelectedStockCode(form.getFieldValue('stockCode'));
          setSelectedDate(record.date);
          updateChartData(record);
        }}>
          查看详情
        </Button>
      ),
    },
  ];

  // 市值筛选回归的表格列配置
  const marketCapColumns = [
    {
      title: '股票代码',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '是否有买入点',
      dataIndex: 'hasBuyPoint',
      key: 'hasBuyPoint',
      render: (text: boolean) => text ? '是' : '否',
    },
    {
      title: '是否当天卖出',
      dataIndex: 'hasSoldSameDay',
      key: 'hasSoldSameDay',
      render: (text: boolean, record: any) => {
        if (!record.hasBuyPoint) return '-';
        return text ? '是' : '否';
      },
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (text: number, record: any) => {
        if (!record.hasBuyPoint) return '-';
        return `${text.toFixed(2)}%`;
      },
    },
    {
      title: '交易结果',
      dataIndex: 'success',
      key: 'success',
      render: (text: boolean, record: any) => {
        if (!record.hasBuyPoint) return '-';
        return text ? '成功' : '失败';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Button type="link" onClick={() => handleDetailClick(record, record.date)}>
          查看详情
        </Button>
      ),
    },
  ];

  // 展开行的表格列配置
  const expandedRowColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      key: 'stockCode',
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
        if (!record.buyPoints || record.buyPoints.length === 0) return '-';
        return moment(record.buyPoints[0].time).format('HH:mm');
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
        if (!record.buyPoints || record.buyPoints.length === 0) return '-';
        if (!record.sellPoints || record.sellPoints.length === 0) return '-';
        return moment(record.sellPoints[0].time).format('HH:mm');
      },
    },
    {
      title: '持仓时间',
      dataIndex: 'holdingTime',
      key: 'holdingTime',
      render: (text: string, record: any) => {
        if (!record.buyPoints || record.buyPoints.length === 0) return '-';
        if (!record.sellPoints || record.sellPoints.length === 0) return '-';
        const buyTime = new Date(record.buyPoints[0].time).getTime();
        const sellTime = new Date(record.sellPoints[0].time).getTime();
        const holdingTime = Math.floor((sellTime - buyTime) / (60 * 1000)); // 转换为分钟
        return holdingTime > 0 ? `${holdingTime} 分钟` : '-';
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
      render: (_: any, detailRecord: any) => (
        <Button type="link" onClick={() => {
          const parentRecord = regressionData.dailyResults.find(
            (r: any) => r.details?.some((d: any) => d.date === detailRecord.date)
          );
          handleDetailClick(parentRecord, detailRecord.date);
          setSelectedStockCode(detailRecord.stockCode);
          updateChartData({
            ...detailRecord,
            stockCode: detailRecord.stockCode
          });
        }}>
          查看详情
        </Button>
      ),
    },
  ];

  // 展开行渲染函数
  const expandedRowRender = (record: any) => {
    return (
      <Table
        columns={expandedRowColumns}
        dataSource={record.details.map((detail: any) => ({
          ...detail,
          stockCode: record.stockCode
        }))}
        pagination={false}
        rowKey="date"
      />
    );
  };

  const config = {
    data: chartData,
    xField: 'time',
    yField: 'value',
    seriesField: 'type',
    yAxis: {
      title: {
        text: '价格',
      },
      min: (min: number) => min * 0.995,
      max: (max: number) => max * 1.005,
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
      size: (datum: any) => {
        if (datum.type === '买入点') return 1000;
        if (datum.type === '卖出点') return 1000;
        return 2;
      },
      shape: (datum: any) => {
        if (datum.type === '买入点') return 'diamond';
        if (datum.type === '卖出点') return 'square';
        return 'circle';
      },
      style: (datum: any) => {
        if (datum.type === '买入点') {
          return {
            fill: '#f5222d',
            stroke: '#f5222d'
          };
        }
        if (datum.type === '卖出点') {
          return {
            fill: '#52c41a',
            stroke: '#52c41a'
          };
        }
        return { opacity: 0.5 };
      },
    },
    color: ['#1890ff', '#faad14', '#f5222d', '#52c41a'],
  };

  // 修改价格走势图标题的显示逻辑
  const getChartTitle = () => {
    if (!selectedDate || !chartData || chartData.length === 0) return '';
    const stockCode = selectedStockCode || chartData[0].stockCode;
    return `${stockCode} - ${selectedDate} 价格走势图`;
  };

  return (
    <div>
      <Card title="分时平均线策略回归测试">
        <Tabs defaultActiveKey="1">
          <TabPane tab="单股回归" key="1">
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
          </TabPane>
          <TabPane tab="市值筛选回归" key="2">
            <Form
              form={marketCapForm}
              onFinish={onMarketCapFinish}
              layout="inline"
            >
              <Form.Item
                name="marketCap"
                label="最小市值(亿)"
                rules={[{ required: true, message: '请输入最小市值' }]}
                initialValue={10000}
              >
                <Input type="number" step={1} />
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
                  开始市值筛选回归
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>

        {regressionData && (
          <>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={6}>
                <Card>
                  <Statistic
                    title={isMarketCapRegression ? "测试股票总数" : "有买入点的天数"}
                    value={regressionData.totalTradingDays}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title={isMarketCapRegression ? "成功股票数" : "当天完成交易天数"}
                    value={regressionData.successDays}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic
                    title={isMarketCapRegression ? "平均成功率" : "当天交易成功率"}
                    value={regressionData.successRate}
                    precision={2}
                    suffix="%"
                  />
                </Card>
              </Col>
              
            </Row>


            <Card title={isMarketCapRegression ? "股票测试结果" : "每日测试结果"} style={{ marginTop: 16 }}>
              <Table
                columns={isMarketCapRegression ? marketCapColumns : singleStockColumns}
                dataSource={regressionData.dailyResults}
                rowKey="date"
                expandable={isMarketCapRegression ? {
                  expandedRowRender: expandedRowRender,
                  expandRowByClick: true
                } : undefined}
              />
            </Card>

            {selectedDate && (
              <Card title={getChartTitle()} style={{ marginTop: 16 }}>
                <Line {...config} />
              </Card>
            )}

            {indexChartData.length > 0 && selectedDate && (
              <Card title={`${selectedDate} 指数涨跌幅走势图`} style={{ marginTop: 16 }}>
                <Line
                  data={indexChartData}
                  xField="time"
                  yField="value"
                  seriesField="type"
                  yAxis={{
                    title: {
                      text: '涨跌幅(%)',
                    },
                    label: {
                      formatter: (v: string) => `${Number(v).toFixed(2)}%`,
                    },
                  }}
                  xAxis={{
                    title: {
                      text: '时间',
                    },
                  }}
                  tooltip={{
                    showMarkers: true,
                    shared: true,
                    showCrosshairs: true,
                    crosshairs: {
                      type: 'xy',
                    },
                    formatter: (datum: any) => {
                      return {
                        name: datum.type,
                        value: `${datum.value.toFixed(2)}%`,
                      };
                    },
                  }}
                  legend={{
                    position: 'top',
                  }}
                  smooth={true}
                  point={{
                    size: 2,
                    style: {
                      opacity: 0.5,
                    },
                  }}
                  color={['#1890ff', '#52c41a']}
                  annotations={[
                    {
                      type: 'line',
                      start: ['min', 0],
                      end: ['max', 0],
                      style: {
                        stroke: '#888',
                        lineDash: [4, 4],
                      },
                    },
                  ]}
                />
              </Card>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default RealtimeRegression; 