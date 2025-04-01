import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button, DatePicker, InputNumber, Select, Radio, Tabs, Spin, message } from 'antd';
import { runBacktest, optimizeBacktest, compareBacktestStrategies } from '@/services/ant-design-pro/api';
import { Line, Column } from '@ant-design/plots';
import moment from 'moment';

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
}

const BacktestPage: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [backtestMode, setBacktestMode] = useState<'single' | 'optimize' | 'compare'>('single');
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [compareResults, setCompareResults] = useState<any>(null);

  // 执行单一策略回测
  const handleSingleBacktest = async (values: any) => {
    setLoading(true);
    try {
      const [startDate, endDate] = values.dateRange;
      
      const response = await runBacktest({
        stockCode: values.stockCode,
        indexCode: values.indexCode || 'NDAQ',
        initialCapital: values.initialCapital,
        investAmount: values.investAmount,
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

  // 执行参数优化回测
  const handleOptimizeBacktest = async (values: any) => {
    setLoading(true);
    try {
      const [startDate, endDate] = values.dateRange;
      
      const response = await optimizeBacktest({
        stockCode: values.stockCode,
        indexCode: values.indexCode || 'NDAQ',
        initialCapital: values.initialCapital,
        investAmount: values.investAmount,
        maxInvestRatio: values.maxInvestRatio,
        strategies: values.strategies,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        sellProfitRangeStart: values.sellProfitRangeStart,
        sellProfitRangeEnd: values.sellProfitRangeEnd,
        sellProfitStep: values.sellProfitStep,
        buybackRangeStart: values.buybackRangeStart,
        buybackRangeEnd: values.buybackRangeEnd,
        buybackStep: values.buybackStep,
      });
      
      if (response.success) {
        setBacktestResult(response.data);
        message.success('参数优化成功');
      } else {
        message.error(response.errorMessage || '参数优化失败');
      }
    } catch (error) {
      console.error('参数优化出错:', error);
      message.error('参数优化出错');
    } finally {
      setLoading(false);
    }
  };

  // 比较不同策略
  const handleCompareBacktest = async (values: any) => {
    setLoading(true);
    try {
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
  const handleSubmit = (values: any) => {
    switch (backtestMode) {
      case 'single':
        handleSingleBacktest(values);
        break;
      case 'optimize':
        handleOptimizeBacktest(values);
        break;
      case 'compare':
        handleCompareBacktest(values);
        break;
    }
  };

  // 渲染回测结果
  const renderBacktestResult = () => {
    if (!backtestResult) return null;

    // 转换交易记录为图表数据
    const buyTransactions = backtestResult.buyTransactions || [];
    const sellTransactions = backtestResult.sellTransactions || [];
    
    // 所有交易的日期排序
    const allTransactions = [...buyTransactions, ...sellTransactions]
      .sort((a, b) => moment(a.date).valueOf() - moment(b.date).valueOf());
    
    // 累计交易金额数据（用于资金曲线）
    const cumulativeData = [];
    let cumulativeInvested = 0;
    let cumulativeValue = backtestResult.initialCapital || 10000;
    
    for (const tx of allTransactions) {
      if (tx.type === 'BUY') {
        cumulativeInvested += tx.amount;
        cumulativeValue -= tx.amount;
      } else if (tx.type === 'SELL') {
        cumulativeValue += tx.amount;
      }
      
      cumulativeData.push({
        date: moment(tx.date).format('YYYY-MM-DD'),
        type: '累计投入',
        value: cumulativeInvested,
      });
      
      cumulativeData.push({
        date: moment(tx.date).format('YYYY-MM-DD'),
        type: '账户价值',
        value: cumulativeValue,
      });
    }

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
              formatter: (datum) => {
                return { name: datum.type, value: `$${Number(datum.value).toFixed(2)}` };
              },
            }}
          />
        </Card>

        <Tabs defaultActiveKey="buy">
          <TabPane tab="买入记录" key="buy">
            <Card>
              <Column
                data={buyTransactions.map((tx: Transaction) => ({
                  date: moment(tx.date).format('YYYY-MM-DD'),
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
            </Card>
          </TabPane>
          <TabPane tab="卖出记录" key="sell">
            <Card>
              <Column
                data={sellTransactions.map((tx: Transaction) => ({
                  date: moment(tx.date).format('YYYY-MM-DD'),
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

  // 渲染表单字段
  const renderFormFields = () => {
    const commonFields = (
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
          initialValue="NDAQ"
        >
          <Input placeholder="输入指数代码，默认为NDAQ" />
        </Form.Item>

        <Form.Item
          name="initialCapital"
          label="初始资金(美元)"
          initialValue={10000}
          rules={[{ required: true, message: '请输入初始资金' }]}
        >
          <InputNumber min={1000} style={{ width: '100%' }} />
        </Form.Item>
      </>
    );

    if (backtestMode === 'compare') {
      return commonFields;
    }

    return (
      <>
        {commonFields}

        <Form.Item
          name="investAmount"
          label="每次定投金额(美元)"
          initialValue={200}
          rules={[{ required: true, message: '请输入每次定投金额' }]}
        >
          <InputNumber min={10} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="maxInvestRatio"
          label="最大使用资金占比"
          initialValue={0.8}
          rules={[{ required: true, message: '请输入最大使用资金占比' }]}
        >
          <InputNumber min={0.1} max={1} step={0.1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="strategies"
          label="定投策略"
          rules={[{ required: true, message: '请选择定投策略' }]}
        >
          <Select
            mode="multiple"
            placeholder="选择一个或多个定投策略"
            style={{ width: '100%' }}
          >
            {strategies.map((strategy) => (
              <Option key={strategy.value} value={strategy.value}>
                {strategy.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="回测时间范围"
          rules={[{ required: true, message: '请选择回测时间范围' }]}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        {backtestMode === 'single' && (
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
        )}

        {backtestMode === 'optimize' && (
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
              initialValue={20}
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
        )}
      </>
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
        <p style={{ paddingLeft: 16 }}>5. 最优参数搜索功能可尝试不同的卖出及回调比例，找出最佳组合</p>
      </div>

      <Card style={{ marginBottom: 24 }}>
        <Radio.Group
          value={backtestMode}
          onChange={(e) => setBacktestMode(e.target.value)}
          style={{ marginBottom: 16 }}
        >
          <Radio.Button value="single">单一策略回测</Radio.Button>
          <Radio.Button value="optimize">最优参数搜索</Radio.Button>
          <Radio.Button value="compare">策略比较</Radio.Button>
        </Radio.Group>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {renderFormFields()}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {backtestMode === 'single' ? '执行回测' : 
                backtestMode === 'optimize' ? '参数优化' : '比较策略'}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Spin spinning={loading}>
        {backtestMode === 'compare' ? renderCompareResults() : renderBacktestResult()}
      </Spin>
    </PageContainer>
  );
};

export default BacktestPage; 