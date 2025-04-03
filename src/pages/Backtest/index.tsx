import React, { useState, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button, DatePicker, InputNumber, Select, Radio, Tabs, Spin, message, Space } from 'antd';
import { runBacktest, optimizeBacktest, compareBacktestStrategies } from '@/services/ant-design-pro/api';
import { Line, Column, Heatmap } from '@ant-design/plots';
import dayjs, { Dayjs } from 'dayjs';
import { request } from '@umijs/max';
import * as XLSX from 'xlsx';

const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

// 策略类型
const strategies = [
  { label: '每周定投', value: 'WEEKLY' },
  { label: '大盘下跌定投', value: 'INDEX_DROP' },
  { label: '连续下跌定投', value: 'CONSECUTIVE_DROP' },
];

// 交易记录接口
interface Transaction {
  date: string | Date;
  price: number;
  quantity: number;
  amount: number;
  type: 'BUY' | 'SELL';
  strategy: string;
  buyPrice?: number;
  profitRate?: number;
  holdingDays?: number;
  isBuyback?: boolean;
  relatedTransactionDate?: string | Date; 
  relatedTransactionPrice?: number;
}

interface BacktestFormValues {
  stockCode: string;
  indexCode?: string;
  initialCapital: number;
  investAmount?: number;
  maxInvestRatio: number;
  strategies: string[];
  dateRange: [Dayjs, Dayjs];
  sellProfitPercentage: number;
  buybackDropPercentage: number;
  maxTimesPerWeek?: number;
  sellProfitRanges?: string;
  buybackRanges?: string;
  sellProfitRangeStart?: number;
  sellProfitRangeEnd?: number;
  sellProfitStep?: number;
  buybackRangeStart?: number;
  buybackRangeEnd?: number;
  buybackStep?: number;
}

// 优化结果接口
interface OptimizationResult {
  sellProfitPercentage: number;
  buybackDropPercentage: number;
  annualizedReturn: number;
  returnRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  transactionCount: number;
  finalValue: number;
  stockReturnRate: number;
  excessStockReturn: number;
  indexReturnRate: number;
  excessIndexReturn: number;
}

// 热力图数据接口
interface HeatMapData {
  sellProfit: string;
  buybackDrop: string;
  value: number;
}

const BacktestPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [backtestMode, setBacktestMode] = useState<'single' | 'optimize' | 'compare'>('single');
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [compareResults, setCompareResults] = useState<any>(null);
  const [optimizationResults, setOptimizationResults] = useState<any>(null);
  const formRef = useRef<any>(null);

  // 执行单一策略回测
  const handleSingleBacktest = async (values: any) => {
    setLoading(true);
    try {
      // 清除之前的结果
      setBacktestResult(null);
      setOptimizationResults(null);
      setCompareResults(null);

      const [startDate, endDate] = values.dateRange;
      
      // 计算默认定投金额（如果用户未指定）
      let investAmount = values.investAmount;
      if (!investAmount) {
        // 计算开始日期和结束日期之间的总周数
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        const totalWeeks = Math.ceil(end.diff(start, 'week', true));
        
        // 计算默认定投金额
        investAmount = Math.round((values.initialCapital * values.maxInvestRatio) / totalWeeks);
        message.info(`自动计算每次定投金额为: $${investAmount}`);
      }
      
      // // 增加最小投资金额检查（至少能买一股，假设平均价格为50美元）
      // const minInvestForOneShare = 50;
      // if (investAmount < minInvestForOneShare) {
      //   investAmount = minInvestForOneShare;
      //   message.info(`已调整定投金额至最小值 $${minInvestForOneShare}（至少可买一股）`);
      // }
      
      const response = await runBacktest({
        stockCode: values.stockCode,
        indexCode: values.indexCode || 'NDAQ',
        initialCapital: values.initialCapital,
        investAmount: investAmount,
        maxInvestRatio: values.maxInvestRatio,
        strategies: values.strategies,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        sellProfitPercentage: values.sellProfitPercentage,
        buybackDropPercentage: values.buybackDropPercentage,
      });
      
      if (response.success) {
        setBacktestResult(response.data);
        message.success('回测执行成功');
      } else {
        message.error(response.errorMessage || '回测执行失败');
      }
    } catch (error) {
      console.error('回测执行出错:', error);
      message.error('回测执行出错');
    } finally {
      setLoading(false);
    }
  };

  // 处理参数优化
  const handleOptimize = async (values: BacktestFormValues) => {
    setLoading(true);
    try {
      // 清除之前的结果
      setBacktestResult(null);
      setOptimizationResults(null);
      setCompareResults(null);

      // 计算默认定投金额（如果用户未指定）
      let investAmount = values.investAmount;
      if (!investAmount) {
        // 计算开始日期和结束日期之间的总周数
        const start = dayjs(values.dateRange[0]);
        const end = dayjs(values.dateRange[1]);
        const totalWeeks = Math.ceil(end.diff(start, 'week', true));
        
        // 计算默认定投金额
        investAmount = Math.round((values.initialCapital * values.maxInvestRatio) / totalWeeks);
        message.info(`自动计算每次定投金额为: $${investAmount}`);
      }

      // 生成参数范围
      const generateRange = (start: number, end: number, step: number) => {
        const range = [];
        for (let value = start; value <= end; value += step) {
          range.push(value);
        }
        return range;
      };

      // 生成卖出盈利比例范围和回调买入比例范围
      let sellProfitRanges = generateRange(
        values.sellProfitRangeStart || 10,
        values.sellProfitRangeEnd || 50,
        values.sellProfitStep || 5
      ).join(',');
      //添加一个500%
      sellProfitRanges = sellProfitRanges + ',9999';

      let buybackRanges = generateRange(
        values.buybackRangeStart || 5,
        values.buybackRangeEnd || 15,
        values.buybackStep || 2.5
      ).join(',');
      //添加一个1000%
      buybackRanges = buybackRanges + ',9999';
      

      const params = {
        stockCode: values.stockCode,
        indexCode: values.indexCode || 'NDAQ',
        initialCapital: values.initialCapital,
        investAmount: investAmount,
        maxInvestRatio: values.maxInvestRatio,
        strategies: values.strategies.join(','),
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        sellProfitRanges: sellProfitRanges,
        buybackRanges: buybackRanges,
        maxTimesPerWeek: values.maxTimesPerWeek || 2,
      };

      const response = await request('/api/backtest/optimize', {
        method: 'GET',
        params: params,
      });
      
      if (response.success) {
        setOptimizationResults(response.data);
        message.success('参数优化完成');
      } else {
        message.error(response.message || '参数优化失败');
      }
    } catch (error) {
      console.error('参数优化出错:', error);
      message.error('参数优化失败，请检查参数后重试');
    } finally {
      setLoading(false);
    }
  };

  // 比较不同策略
  const handleCompareBacktest = async (values: any) => {
    setLoading(true);
    try {
      // 清除之前的结果
      setBacktestResult(null);
      setOptimizationResults(null);
      setCompareResults(null);

      const response = await compareBacktestStrategies({
        stockCode: values.stockCode,
        indexCode: values.indexCode || 'NDAQ',
        initialCapital: values.initialCapital,
      });
      
      if (response.success) {
        setCompareResults(response.data);
        message.success('策略比较成功');
      } else {
        message.error(response.errorMessage || '策略比较失败');
      }
    } catch (error) {
      console.error('策略比较出错:', error);
      message.error('策略比较出错');
    } finally {
      setLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      
      // 清除之前的结果
      setBacktestResult(null);
      setOptimizationResults(null);
      setCompareResults(null);

      // 计算默认定投金额（如果用户未指定）
      let investAmount = values.investAmount;
      if (!investAmount) {
        // 计算开始日期和结束日期之间的总周数
        const start = dayjs(values.dateRange[0]);
        const end = dayjs(values.dateRange[1]);
        const totalWeeks = Math.ceil(end.diff(start, 'week', true));
        
        // 计算默认定投金额
        investAmount = Math.round((values.initialCapital * values.maxInvestRatio) / totalWeeks);
        message.info(`自动计算每次定投金额为: $${investAmount}`);
      }

      const params = {
        stockCode: values.stockCode,
        indexCode: values.indexCode || 'NDAQ',
        initialCapital: values.initialCapital || 100000,
        investAmount: investAmount,
        maxInvestRatio: values.maxInvestRatio || 0.8,
        strategies: values.strategies.join(','),
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        sellProfitPercentage: values.sellProfitPercentage || 20.0,
        buybackDropPercentage: values.buybackDropPercentage || 10.0,
        maxTimesPerWeek: values.strategies.includes('INDEX_DROP') ? (values.maxTimesPerWeek || 2) : undefined
      };

      const response = await request('/api/backtest/run', {
        method: 'GET',
        params: params,
      });
      if (response.success) {
        setBacktestResult(response.data);
      } else {
        message.error(response.message || '回测失败');
      }
    } catch (error) {
      console.error('回测出错:', error);
      message.error('回测失败，请检查参数后重试');
    } finally {
      setLoading(false);
    }
  };

  // 渲染回测结果
  const renderBacktestResult = () => {
    if (!backtestResult) return null;

    // 转换每日资金数据为图表数据
    const cumulativeData = (backtestResult.dailyBalances || []).flatMap((daily: any) => [
      {
        date: dayjs(daily.date).format('YYYY-MM-DD'),
        type: '累计投入',
        value: daily.cumulativeInvestment,
      },
      {
        date: dayjs(daily.date).format('YYYY-MM-DD'),
        type: '账户现金',
        value: daily.cashBalance,
      },
      {
        date: dayjs(daily.date).format('YYYY-MM-DD'),
        type: '资产总值',
        value: daily.totalValue,
      },
    ]);

    // 获取买入和卖出记录
    const buyTransactions = backtestResult.buyTransactions || [];
    const sellTransactions = backtestResult.sellTransactions || [];

    return (
      <div>
        <Card title="回测结果概览" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
              <h4>收益率</h4>
              <div style={{ fontSize: 24, color: backtestResult.returnRate >= 0 ? '#52c41a' : '#f5222d' }}>
                {backtestResult.returnRate.toFixed(2)}%
              </div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
              <h4>年化收益率</h4>
              <div style={{ fontSize: 24, color: backtestResult.annualizedReturn >= 0 ? '#52c41a' : '#f5222d' }}>
                {backtestResult.annualizedReturn.toFixed(2)}%
              </div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
              <h4>最大回撤</h4>
              <div style={{ fontSize: 24, color: '#f5222d' }}>
                {backtestResult.maxDrawdown.toFixed(2)}%
              </div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
              <h4>夏普比率</h4>
              <div style={{ fontSize: 24 }}>
                {backtestResult.sharpeRatio.toFixed(2)}
              </div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
              <h4>总投入资金</h4>
              <div style={{ fontSize: 24 }}>
                ${backtestResult.totalInvestment.toFixed(2)}
              </div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
              <h4>最终价值</h4>
              <div style={{ fontSize: 24 }}>
                ${backtestResult.finalValue.toFixed(2)}
              </div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
              <h4>交易次数</h4>
              <div style={{ fontSize: 24 }}>
                {backtestResult.transactionCount}
              </div>
            </div>
            <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
              <h4>持仓天数</h4>
              <div style={{ fontSize: 24 }}>
                {backtestResult.holdingDays}
              </div>
            </div>
            {backtestResult.stockDailyReturns && backtestResult.stockDailyReturns.length > 0 && (
              <>
                <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
                  <h4>股票自身涨跌幅</h4>
                  <div style={{ fontSize: 24, color: backtestResult.stockDailyReturns[backtestResult.stockDailyReturns.length - 1].returnRate >= 0 ? '#52c41a' : '#f5222d' }}>
                    {backtestResult.stockDailyReturns[backtestResult.stockDailyReturns.length - 1].returnRate.toFixed(2)}%
                  </div>
                </div>
                <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
                  <h4>相对股票超额收益</h4>
                  <div style={{ fontSize: 24, color: (backtestResult.returnRate - backtestResult.stockDailyReturns[backtestResult.stockDailyReturns.length - 1].returnRate) >= 0 ? '#52c41a' : '#f5222d' }}>
                    {(backtestResult.returnRate - backtestResult.stockDailyReturns[backtestResult.stockDailyReturns.length - 1].returnRate).toFixed(2)}%
                  </div>
                </div>
              </>
            )}
            {backtestResult.indexDailyReturns && backtestResult.indexDailyReturns.length > 0 && (
              <>
                <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
                  <h4>指数涨跌幅</h4>
                  <div style={{ fontSize: 24, color: backtestResult.indexDailyReturns[backtestResult.indexDailyReturns.length - 1].returnRate >= 0 ? '#52c41a' : '#f5222d' }}>
                    {backtestResult.indexDailyReturns[backtestResult.indexDailyReturns.length - 1].returnRate.toFixed(2)}%
                  </div>
                </div>
                <div style={{ flex: '1 1 200px', padding: '0 16px', margin: '8px 0' }}>
                  <h4>相对指数超额收益</h4>
                  <div style={{ fontSize: 24, color: (backtestResult.returnRate - backtestResult.indexDailyReturns[backtestResult.indexDailyReturns.length - 1].returnRate) >= 0 ? '#52c41a' : '#f5222d' }}>
                    {(backtestResult.returnRate - backtestResult.indexDailyReturns[backtestResult.indexDailyReturns.length - 1].returnRate).toFixed(2)}%
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>

        <Card title="资金曲线" style={{ marginBottom: 16 }}>
          <Line
            data={cumulativeData}
            xField="date"
            yField="value"
            seriesField="type"
            yAxis={{
              label: {
                formatter: (v) => `$${Number(v).toFixed(2)}`,
              },
            }}
            tooltip={{
              formatter: (datum) => ({
                name: datum.type,
                value: `$${Number(datum.value).toFixed(2)}`,
              }),
            }}
            legend={{
              position: 'top',
            }}
            smooth={true}
            color={['#1890ff', '#52c41a', '#fa8c16']}  // 蓝色表示累计投入，绿色表示账户现金，橙色表示资产总值
          />
        </Card>

        <Card title="收益率对比" style={{ marginBottom: 16 }}>
          <Line
            data={[
              ...(backtestResult.dailyReturns || []).map((item: any) => ({
                date: dayjs(item.date).format('YYYY-MM-DD'),
                type: '策略收益率',
                value: item.returnRate,
              })),
              ...(backtestResult.indexDailyReturns || []).map((item: any) => ({
                date: dayjs(item.date).format('YYYY-MM-DD'),
                type: '指数涨跌幅',
                value: item.returnRate,
              })),
              ...(backtestResult.stockDailyReturns || []).map((item: any) => ({
                date: dayjs(item.date).format('YYYY-MM-DD'),
                type: '股票涨跌幅',
                value: item.returnRate,
              })),
            ]}
            xField="date"
            yField="value"
            seriesField="type"
            yAxis={{
              label: {
                formatter: (v) => `${Number(v).toFixed(2)}%`,
              },
            }}
            tooltip={{
              formatter: (datum) => ({
                name: datum.type,
                value: `${Number(datum.value).toFixed(2)}%`,
              }),
            }}
            legend={{
              position: 'top',
            }}
            smooth={true}
            point={{
              size: 2,
              shape: 'circle',
            }}
            color={['#52c41a', '#1890ff', '#fa8c16']}
          />
        </Card>

        <Tabs defaultActiveKey="buy">
          <TabPane tab="买入记录" key="buy">
            <Card>
              <Column
                data={buyTransactions.map((tx: Transaction) => ({
                  date: dayjs(tx.date).format('YYYY-MM-DD'),
                  amount: tx.amount,
                  strategy: tx.strategy,
                }))}
                xField="date"
                yField="amount"
                seriesField="strategy"
                isStack={true}
                label={{
                  position: 'middle',
                  formatter: (datum) => `$${Number(datum.amount).toFixed(0)}`,
                }}
                yAxis={{
                  label: {
                    formatter: (v) => `$${Number(v).toFixed(0)}`,
                  },
                }}
              />
              
              <div style={{ marginTop: 24 }}>
                <h4>买入交易详情</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>日期</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>价格</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>数量</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>金额</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>策略</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>类型</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>关联信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyTransactions.map((tx: Transaction, index: number) => (
                      <tr key={`buy-${index}`} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px' }}>{dayjs(tx.date).format('YYYY-MM-DD')}</td>
                        <td style={{ padding: '10px' }}>${tx.price.toFixed(2)}</td>
                        <td style={{ padding: '10px' }}>{tx.quantity}</td>
                        <td style={{ padding: '10px' }}>${tx.amount.toFixed(2)}</td>
                        <td style={{ padding: '10px' }}>{tx.strategy}</td>
                        <td style={{ padding: '10px' }}>
                          {tx.isBuyback ? '回调买入' : '定投买入'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          {tx.relatedTransactionDate && tx.relatedTransactionPrice ? (
                            <span>
                              关联卖出: {dayjs(tx.relatedTransactionDate).format('YYYY-MM-DD')} 
                              价格: ${tx.relatedTransactionPrice.toFixed(2)}
                            </span>
                          ) : '普通定投'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabPane>
          <TabPane tab="卖出记录" key="sell">
            <Card>
              <Column
                data={sellTransactions.map((tx: Transaction) => ({
                  date: dayjs(tx.date).format('YYYY-MM-DD'),
                  amount: tx.amount,
                  strategy: tx.strategy,
                }))}
                xField="date"
                yField="amount"
                seriesField="strategy"
                isStack={true}
                label={{
                  position: 'middle',
                  formatter: (datum) => `$${Number(datum.amount).toFixed(0)}`,
                }}
                yAxis={{
                  label: {
                    formatter: (v) => `$${Number(v).toFixed(0)}`,
                  },
                }}
              />
              
              <div style={{ marginTop: 24 }}>
                <h4>卖出交易详情</h4>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                  <thead>
                    <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>日期</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>价格</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>数量</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>金额</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>策略</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>盈利率</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>持仓天数</th>
                      <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>关联信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellTransactions.map((tx: Transaction, index: number) => (
                      <tr key={`sell-${index}`} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '10px' }}>{dayjs(tx.date).format('YYYY-MM-DD')}</td>
                        <td style={{ padding: '10px' }}>${tx.price.toFixed(2)}</td>
                        <td style={{ padding: '10px' }}>{tx.quantity}</td>
                        <td style={{ padding: '10px' }}>${tx.amount.toFixed(2)}</td>
                        <td style={{ padding: '10px' }}>{tx.strategy}</td>
                        <td style={{ padding: '10px', color: (tx.profitRate || 0) >= 0 ? '#52c41a' : '#f5222d' }}>
                          {tx.profitRate?.toFixed(2)}%
                        </td>
                        <td style={{ padding: '10px' }}>{tx.holdingDays} 天</td>
                        <td style={{ padding: '10px' }}>
                          {tx.relatedTransactionDate && tx.relatedTransactionPrice ? (
                            <span>
                              关联买入: {dayjs(tx.relatedTransactionDate).format('YYYY-MM-DD')} 
                              价格: ${tx.relatedTransactionPrice.toFixed(2)}
                            </span>
                          ) : '未知'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </div>
    );
  };

  // 渲染策略比较结果
  const renderCompareResults = () => {
    if (!compareResults) return null;

    // 提取各策略的主要指标数据
    const metrics = Object.entries(compareResults).map(([strategy, result]) => {
      const data = result as any;
      return [
        { strategy, metric: '收益率', value: data.returnRate },
        { strategy, metric: '年化收益率', value: data.annualizedReturn },
        { strategy, metric: '最大回撤', value: data.maxDrawdown },
        { strategy, metric: '夏普比率', value: data.sharpeRatio },
        { strategy, metric: '交易次数', value: data.transactionCount },
      ];
    }).flat();

    return (
      <div>
        <Card title="策略比较" style={{ marginBottom: 16 }}>
          <Column
            data={metrics}
            xField="strategy"
            yField="value"
            seriesField="metric"
            isGroup={true}
            columnStyle={{
              radius: [4, 4, 0, 0],
            }}
            label={{
              position: 'top',
              formatter: (datum) => {
                if (datum.metric.includes('率') || datum.metric.includes('回撤')) {
                  return `${Number(datum.value).toFixed(2)}%`;
                }
                return datum.value.toFixed(2);
              },
            }}
          />
        </Card>
      </div>
    );
  };

  // 渲染优化结果
  const renderOptimizationResults = () => {
    if (!optimizationResults || optimizationResults.length === 0) return null;

    // 按年化收益率排序
    const sortedResults = [...optimizationResults].sort((a: OptimizationResult, b: OptimizationResult) => 
      b.annualizedReturn - a.annualizedReturn
    );

    // 添加导出 Excel 函数
    const exportToExcel = () => {
      try {
        // 获取当前表单数据
        const formValues = formRef.current?.getFieldsValue();
        const startDate = formValues?.dateRange[0].format('YYYYMMDD');
        const endDate = formValues?.dateRange[1].format('YYYYMMDD');
        const stockCode = formValues?.stockCode;

        // 准备 Excel 数据
        const excelData = sortedResults.map(result => ({
          '卖出盈利比例(%)': result.sellProfitPercentage === 9999 ? '不卖出' : result.sellProfitPercentage.toFixed(1),
          '回调买入比例(%)': result.buybackDropPercentage === 9999 ? '不买入' : result.buybackDropPercentage.toFixed(1),
          '年化收益率(%)': result.annualizedReturn.toFixed(2),
          '收益率(%)': result.returnRate.toFixed(2),
          '最大回撤(%)': result.maxDrawdown.toFixed(2),
          '夏普比率': result.sharpeRatio.toFixed(2),
          '交易次数': result.transactionCount,
          '最终价值($)': result.finalValue.toFixed(2),
          '股票涨跌幅(%)': result.stockReturnRate.toFixed(2),
          '相对股票超额收益(%)': result.excessStockReturn.toFixed(2),
          '指数涨跌幅(%)': result.indexReturnRate.toFixed(2),
          '相对指数超额收益(%)': result.excessIndexReturn.toFixed(2),
        }));

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(excelData);

        // 设置列宽
        const colWidths = [
          { wch: 15 }, // 卖出盈利比例
          { wch: 15 }, // 回调买入比例
          { wch: 15 }, // 年化收益率
          { wch: 12 }, // 收益率
          { wch: 12 }, // 最大回撤
          { wch: 10 }, // 夏普比率
          { wch: 10 }, // 交易次数
          { wch: 15 }, // 最终价值
          { wch: 15 }, // 股票涨跌幅
          { wch: 20 }, // 相对股票超额收益
          { wch: 15 }, // 指数涨跌幅
          { wch: 20 }, // 相对指数超额收益
        ];
        ws['!cols'] = colWidths;

        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(wb, ws, '参数优化结果');

        // 生成文件名
        const fileName = `${stockCode}_${startDate}_${endDate}_回测数据.xlsx`;

        // 保存文件
        XLSX.writeFile(wb, fileName);
        message.success('导出成功！');
      } catch (error) {
        console.error('导出失败:', error);
        message.error('导出失败，请重试');
      }
    };

    return (
      <div>
        <Card 
          title="参数优化结果" 
          style={{ marginBottom: 16 }}
          extra={
            <Button type="primary" onClick={exportToExcel}>
              导出Excel
            </Button>
          }
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f0f0f0', textAlign: 'left' }}>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>卖出盈利比例(%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>回调买入比例(%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>年化收益率(%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>收益率(%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>最大回撤(%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>夏普比率</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>交易次数</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>最终价值($)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>股票涨跌幅(%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>相对股票超额收益(%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>指数涨跌幅(%)</th>
                <th style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>相对指数超额收益(%)</th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((result: OptimizationResult, index: number) => (
                <tr 
                  key={index} 
                  style={{ 
                    borderBottom: '1px solid #ddd',
                    background: index === 0 ? '#f6ffed' : 'inherit' // 最优结果高亮显示
                  }}
                >
                  <td style={{ padding: '10px' }}>
                    {result.sellProfitPercentage === 9999 ? '不卖出' : result.sellProfitPercentage.toFixed(1)}
                  </td>
                  <td style={{ padding: '10px' }}>
                    {result.buybackDropPercentage === 9999 ? '不买入' : result.buybackDropPercentage.toFixed(1)}
                  </td>
                  <td style={{ padding: '10px', color: result.annualizedReturn >= 0 ? '#52c41a' : '#f5222d' }}>
                    {result.annualizedReturn.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px', color: result.returnRate >= 0 ? '#52c41a' : '#f5222d' }}>
                    {result.returnRate.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px', color: '#f5222d' }}>
                    {result.maxDrawdown.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px' }}>{result.sharpeRatio.toFixed(2)}</td>
                  <td style={{ padding: '10px' }}>{result.transactionCount}</td>
                  <td style={{ padding: '10px' }}>{result.finalValue.toFixed(2)}</td>
                  <td style={{ padding: '10px', color: result.stockReturnRate >= 0 ? '#52c41a' : '#f5222d' }}>
                    {result.stockReturnRate.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px', color: result.excessStockReturn >= 0 ? '#52c41a' : '#f5222d' }}>
                    {result.excessStockReturn.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px', color: result.indexReturnRate >= 0 ? '#52c41a' : '#f5222d' }}>
                    {result.indexReturnRate.toFixed(2)}
                  </td>
                  <td style={{ padding: '10px', color: result.excessIndexReturn >= 0 ? '#52c41a' : '#f5222d' }}>
                    {result.excessIndexReturn.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="参数优化热力图" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* 年化收益率热力图 */}
            <div style={{ flex: 1 }}>
              <h4>年化收益率热力图</h4>
              <Heatmap
                data={optimizationResults.map((result: OptimizationResult): HeatMapData => ({
                  sellProfit: result.sellProfitPercentage === 9999 ? '不卖出' : result.sellProfitPercentage.toFixed(1),
                  buybackDrop: result.buybackDropPercentage === 9999 ? '不买入' : result.buybackDropPercentage.toFixed(1),
                  value: result.annualizedReturn
                }))}
                xField="sellProfit"
                yField="buybackDrop"
                colorField="value"
                color={['#f7acbc', '#ffffff', '#52c41a']}
                label={{
                  formatter: (data) => `${(data as any).value.toFixed(1)}%`,
                  style: {
                    fontSize: 10,
                  },
                }}
                meta={{
                  value: {
                    min: Math.min(...optimizationResults.map((r: OptimizationResult) => r.annualizedReturn)),
                    max: Math.max(...optimizationResults.map((r: OptimizationResult) => r.annualizedReturn)),
                  },
                }}
              />
            </div>

            {/* 最大回撤热力图 */}
            <div style={{ flex: 1 }}>
              <h4>最大回撤热力图</h4>
              <Heatmap
                data={optimizationResults.map((result: OptimizationResult): HeatMapData => ({
                  sellProfit: result.sellProfitPercentage === 9999 ? '不卖出' : result.sellProfitPercentage.toFixed(1),
                  buybackDrop: result.buybackDropPercentage === 9999 ? '不买入' : result.buybackDropPercentage.toFixed(1),
                  value: result.maxDrawdown
                }))}
                xField="sellProfit"
                yField="buybackDrop"
                colorField="value"
                color={['#52c41a', '#ffffff', '#f7acbc']}
                label={{
                  formatter: (data) => `${(data as any).value.toFixed(1)}%`,
                  style: {
                    fontSize: 10,
                  },
                }}
                meta={{
                  value: {
                    min: Math.min(...optimizationResults.map((r: OptimizationResult) => r.maxDrawdown)),
                    max: Math.max(...optimizationResults.map((r: OptimizationResult) => r.maxDrawdown)),
                  },
                }}
              />
            </div>
          </div>
        </Card>
      </div>
    );
  };

  // 渲染表单字段
  const renderFormFields = () => {
    return (
      <>
        <Form.Item
          name="stockCode"
          label="股票代码"
          rules={[{ required: true, message: '请输入股票代码' }]}
        >
          <Input placeholder="输入股票代码，如：AAPL" />
        </Form.Item>

        <Form.Item
          name="indexCode"
          label="指数代码"
          initialValue="QQQ"
        >
          <Input placeholder="输入指数代码，默认为QQQ" />
        </Form.Item>

        <Form.Item
          name="initialCapital"
          label="初始资金(美元)"
          initialValue={100000}
          rules={[{ required: true, message: '请输入初始资金' }]}
        >
          <InputNumber min={1000} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="investAmount"
          label="每次定投金额(美元)"
          rules={[{ required: false, message: '请输入每次定投金额' }]}
        >
          <InputNumber 
            min={10} 
            style={{ width: '100%' }} 
            placeholder="留空则自动计算：初始金额*最大使用资金占比/总周数"
          />
        </Form.Item>

        <Form.Item
          name="maxInvestRatio"
          label="最大使用资金占比"
          initialValue={1}
          rules={[{ required: true, message: '请输入最大使用资金占比' }]}
        >
          <InputNumber min={0.1} max={1} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          label="策略选择"
          name="strategies"
          rules={[{ required: true, message: '请选择至少一个策略' }]}
        >
          <Select
            mode="multiple"
            placeholder="请选择定投策略"
            options={[
              { label: '每周定投', value: 'WEEKLY' },
              { label: '大盘下跌定投', value: 'INDEX_DROP' },
              { label: '连续下跌定投', value: 'CONSECUTIVE_DROP' },
            ]}
          />
        </Form.Item>

        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues?.strategies !== currentValues?.strategies
          }
        >
          {({ getFieldValue }) => {
            const strategies = getFieldValue('strategies') || [];
            return strategies.includes('INDEX_DROP') ? (
              <Form.Item
                label="大盘下跌定投每周最大次数"
                name="maxTimesPerWeek"
                initialValue={1}
                rules={[{ required: true, message: '请选择每周最大执行次数' }]}
              >
                <Select
                  placeholder="请选择每周最大执行次数"
                  options={[
                    { label: '每周1次', value: 1 },
                    { label: '每周2次', value: 2 },
                    { label: '每周3次', value: 3 },
                    { label: '每周4次', value: 4 },
                  ]}
                />
              </Form.Item>
            ) : null;
          }}
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="回测时间范围"
          rules={[{ required: true, message: '请选择回测时间范围' }]}
        >
          <RangePicker 
            style={{ width: '100%' }} 
            disabledDate={(current) => current && current < dayjs('2015-04-01')}
            ranges={{
              '近1年': [
                dayjs().subtract(1, 'year').startOf('year'),
                dayjs().subtract(1, 'year').endOf('year')
              ],
              '近3年': [
                dayjs().subtract(3, 'year').startOf('year'),
                dayjs().subtract(1, 'year').endOf('year')
              ],
              '近5年': [
                dayjs().subtract(5, 'year').startOf('year'),
                dayjs().subtract(1, 'year').endOf('year')
              ],
              '2021-2023': [
                dayjs('2021-01-01'),
                dayjs('2023-12-31')
              ],
              '2020-2022': [
                dayjs('2020-01-01'),
                dayjs('2022-12-31')
              ],
              '2019-2021': [
                dayjs('2019-01-01'),
                dayjs('2021-12-31')
              ],
              '2018-2020': [
                dayjs('2018-01-01'),
                dayjs('2020-12-31')
              ],
              '2017-2019': [
                dayjs('2017-01-01'),
                dayjs('2019-12-31')
              ],
              '2016-2018': [
                dayjs('2016-01-01'),
                dayjs('2018-12-31')
              ],
              '2015-2017': [
                dayjs('2015-04-01'),
                dayjs('2017-12-31')
              ]
            }}
          />
        </Form.Item>

        {backtestMode === 'single' ? (
          <>
            <Form.Item
              name="sellProfitPercentage"
              label="卖出盈利比例(%)"
              initialValue={20}
              rules={[{ required: true, message: '请输入卖出盈利比例' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="buybackDropPercentage"
              label="回调买入比例(%)"
              initialValue={10}
              rules={[{ required: true, message: '请输入回调买入比例' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </>
        ) : backtestMode === 'optimize' ? (
          <>
            <Form.Item
              name="sellProfitRangeStart"
              label="卖出盈利比例起始值(%)"
              initialValue={10}
              rules={[{ required: true, message: '请输入卖出盈利比例起始值' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="sellProfitRangeEnd"
              label="卖出盈利比例结束值(%)"
              initialValue={50}
              rules={[{ required: true, message: '请输入卖出盈利比例结束值' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="sellProfitStep"
              label="卖出盈利比例步长(%)"
              initialValue={5}
              rules={[{ required: true, message: '请输入卖出盈利比例步长' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="buybackRangeStart"
              label="回调买入比例起始值(%)"
              initialValue={5}
              rules={[{ required: true, message: '请输入回调买入比例起始值' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="buybackRangeEnd"
              label="回调买入比例结束值(%)"
              initialValue={15}
              rules={[{ required: true, message: '请输入回调买入比例结束值' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="buybackStep"
              label="回调买入比例步长(%)"
              initialValue={2.5}
              rules={[{ required: true, message: '请输入回调买入比例步长' }]}
            >
              <InputNumber min={0.5} style={{ width: '100%' }} />
            </Form.Item>
          </>
        ) : null}
      </>
    );
  };

  // 渲染表单按钮
  const renderFormButtons = () => {
    return (
      <Form.Item>
        <Space>
          {backtestMode === 'single' && (
            <Button type="primary" htmlType="submit" loading={loading}>
              执行回测
            </Button>
          )}
          {backtestMode === 'optimize' && (
            <Button 
              type="primary"
              onClick={() => {
                const form = formRef.current;
                if (form) {
                  form.validateFields().then((values: BacktestFormValues) => {
                    handleOptimize(values);
                  });
                }
              }}
              loading={loading}
            >
              最优参数回测
            </Button>
          )}
        </Space>
      </Form.Item>
    );
  };

  return (
    <PageContainer>
      <div style={{ marginBottom: 16, padding: '16px 24px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ marginBottom: 8, fontWeight: 'bold' }}>定投策略回测说明：</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>1. 每周定投：每周五收盘对定投股票进行买入</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>2. 大盘下跌定投：周一到周四，大盘指数下跌1.8%时买入</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>3. 连续下跌定投：周一到周四连续下跌时，周四收盘买入</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>4. 可以设置盈利多少卖出以及回调多少买回的策略进行回测</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>5. 最优参数回测功能可尝试不同的卖出及回调比例，找出最佳组合</p>
        <p style={{ paddingLeft: 16 }}>6. 回测数据可用时间范围：2015年4月1日至今</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Radio.Group
          value={backtestMode}
          onChange={(e) => {
            setBacktestMode(e.target.value);
          }}
          style={{ marginBottom: 16 }}
        >
          <Radio.Button value="single">单一策略回测</Radio.Button>
          <Radio.Button value="optimize">最优参数回测</Radio.Button>
          {/* <Radio.Button value="compare">策略比较</Radio.Button> */}
        </Radio.Group>

        <Form
          ref={formRef}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {renderFormFields()}
          {renderFormButtons()}
        </Form>
      </Card>

      <Spin spinning={loading}>
        {backtestMode === 'compare' ? renderCompareResults() : (
          <>
            {renderBacktestResult()}
            {renderOptimizationResults()}
          </>
        )}
      </Spin>
    </PageContainer>
  );
};

export default BacktestPage; 