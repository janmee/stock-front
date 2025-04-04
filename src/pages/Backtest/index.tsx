import React, { useState, useRef, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button, DatePicker, InputNumber, Select, Radio, Tabs, Spin, message, Space } from 'antd';
import { runBacktest, optimizeBacktest, compareBacktestStrategies } from '@/services/ant-design-pro/api';
import { Line, Column, Heatmap } from '@ant-design/plots';
import dayjs, { Dayjs } from 'dayjs';
import { request } from '@umijs/max';
import * as XLSX from 'xlsx';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';

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
  stockCode?: string;
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
  dateRanges: [Dayjs, Dayjs][];  // 修改为数组，支持多个时间范围
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
  const [optimizationResults, setOptimizationResults] = useState<any[]>([]);  // 修改为数组，存储多个结果
  const [activeTab, setActiveTab] = useState<string>('0');  // 添加当前激活的标签页状态
  const formRef = useRef<any>(null);

  // 添加默认时间范围 - 近3年
  useEffect(() => {
    // 默认设置时间范围为近3年（过去3年到1年）
    const defaultDateRange = [
      dayjs().subtract(3, 'year').startOf('year'),
      dayjs().subtract(1, 'year').endOf('year')
    ];
    
    // 如果表单已经初始化，设置默认时间范围
    if (formRef.current) {
      const currentValues = formRef.current.getFieldsValue();
      if (!currentValues.dateRanges || currentValues.dateRanges.length === 0) {
        formRef.current.setFieldsValue({ 
          dateRanges: [defaultDateRange] 
        });
      }
    }
  }, [formRef]);

  // 执行单一策略回测
  const handleSingleBacktest = async (values: any) => {
    setLoading(true);
    try {
      // 清除之前的结果
      setBacktestResult(null);
      setOptimizationResults([]);
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
      setOptimizationResults([]);
      setCompareResults(null);

      // 计算默认定投金额（如果用户未指定）
      let investAmount = values.investAmount;
      if (!investAmount) {
        // 计算开始日期和结束日期之间的总周数
        const start = dayjs(values.dateRanges[0][0]);
        const end = dayjs(values.dateRanges[0][1]);
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
      sellProfitRanges = sellProfitRanges + ',9999';

      let buybackRanges = generateRange(
        values.buybackRangeStart || 5,
        values.buybackRangeEnd || 15,
        values.buybackStep || 2.5
      ).join(',');
      buybackRanges = buybackRanges + ',9999';

      // 为每个时间范围执行优化
      const results = await Promise.all(values.dateRanges.map(async (dateRange) => {
        const params = {
          stockCode: values.stockCode,
          indexCode: values.indexCode || 'NDAQ',
          initialCapital: values.initialCapital,
          investAmount: investAmount,
          maxInvestRatio: values.maxInvestRatio,
          strategies: values.strategies.join(','),
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          sellProfitRanges: sellProfitRanges,
          buybackRanges: buybackRanges,
          maxTimesPerWeek: values.maxTimesPerWeek || 2,
        };

        const response = await request('/api/backtest/optimize', {
          method: 'GET',
          params: params,
        });

        if (response.success) {
          return {
            dateRange: dateRange,
            results: response.data
          };
        } else {
          throw new Error(response.message || '参数优化失败');
        }
      }));

      setOptimizationResults(results);
      setActiveTab('0');  // 设置第一个标签页为激活状态
      message.success('参数优化完成');
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
      setOptimizationResults([]);
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
      setOptimizationResults([]);
      setCompareResults(null);

      if (backtestMode === 'single') {
        // 单一策略回测
        const [startDate, endDate] = values.dateRanges[0];
        
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

        const params = {
          stockCode: values.stockCode,
          indexCode: values.indexCode || 'NDAQ',
          initialCapital: values.initialCapital || 100000,
          investAmount: investAmount,
          maxInvestRatio: values.maxInvestRatio || 0.8,
          strategies: values.strategies.join(','),
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
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
      } else if (backtestMode === 'optimize') {
        // 最优参数回测
        await handleOptimize(values);
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

    // 添加导出Excel的功能
    const exportSingleBacktestToExcel = () => {
      try {
        // 从表单中获取股票代码
        const formValues = formRef.current?.getFieldsValue();
        const stockCode = formValues?.stockCode || backtestResult.stockCode || '未知';
        const startDate = dayjs(backtestResult.startDate).format('YYYYMMDD');
        const endDate = dayjs(backtestResult.endDate).format('YYYYMMDD');
  
        // 创建工作簿
        const wb = XLSX.utils.book_new();
  
        // 准备回测结果概览数据
        const overviewData: Record<string, any>[] = [{
          '股票代码': stockCode,
          '回测时间范围': `${dayjs(backtestResult.startDate).format('YYYY-MM-DD')} 至 ${dayjs(backtestResult.endDate).format('YYYY-MM-DD')}`,
          '年化收益率(%)': backtestResult.annualizedReturn.toFixed(2),
          '收益率(%)': backtestResult.returnRate.toFixed(2),
          '最大回撤(%)': backtestResult.maxDrawdown.toFixed(2),
          '总投入资金($)': backtestResult.totalInvestment.toFixed(2),
          '最终价值($)': backtestResult.finalValue.toFixed(2),
          '交易次数': backtestResult.transactionCount,
          '持仓天数': backtestResult.holdingDays || 0
        }];
  
        // 如果有股票自身涨跌幅和指数数据，添加到概览
        if (backtestResult.stockDailyReturns && backtestResult.stockDailyReturns.length > 0) {
          overviewData[0]['股票自身涨跌幅(%)'] = backtestResult.stockDailyReturns[backtestResult.stockDailyReturns.length - 1].returnRate.toFixed(2);
          overviewData[0]['相对股票超额收益(%)'] = (backtestResult.returnRate - backtestResult.stockDailyReturns[backtestResult.stockDailyReturns.length - 1].returnRate).toFixed(2);
        }
  
        if (backtestResult.indexDailyReturns && backtestResult.indexDailyReturns.length > 0) {
          overviewData[0]['指数涨跌幅(%)'] = backtestResult.indexDailyReturns[backtestResult.indexDailyReturns.length - 1].returnRate.toFixed(2);
          overviewData[0]['相对指数超额收益(%)'] = (backtestResult.returnRate - backtestResult.indexDailyReturns[backtestResult.indexDailyReturns.length - 1].returnRate).toFixed(2);
        }

        // 创建概览工作表
        const overviewWs = XLSX.utils.json_to_sheet(overviewData);
        
        // 设置列宽以确保股票代码可见
        const overviewColWidths = [
          { wch: 12 },  // 股票代码
          { wch: 20 },  // 回测时间范围
          { wch: 15 },  // 年化收益率
          { wch: 12 },  // 收益率
          { wch: 12 },  // 最大回撤
          { wch: 15 },  // 总投入资金
          { wch: 15 },  // 最终价值
          { wch: 10 },  // 交易次数
          { wch: 10 },  // 持仓天数
        ];
        overviewWs['!cols'] = overviewColWidths;
        
        XLSX.utils.book_append_sheet(wb, overviewWs, '回测结果概览');

        // 准备买入交易数据
        const buyTransactionsData = (backtestResult.buyTransactions || []).map((tx: Transaction) => ({
          '股票代码': stockCode,  // 添加股票代码到每条记录
          '日期': dayjs(tx.date).format('YYYY-MM-DD'),
          '价格($)': tx.price.toFixed(2),
          '数量': tx.quantity,
          '金额($)': tx.amount.toFixed(2),
          '策略': tx.strategy,
          '类型': tx.isBuyback ? '回调买入' : '定投买入',
          '关联卖出日期': tx.relatedTransactionDate ? dayjs(tx.relatedTransactionDate).format('YYYY-MM-DD') : '',
          '关联卖出价格($)': tx.relatedTransactionPrice ? tx.relatedTransactionPrice.toFixed(2) : ''
        }));

        // 创建买入交易工作表
        if (buyTransactionsData.length > 0) {
          const buyWs = XLSX.utils.json_to_sheet(buyTransactionsData);
          // 设置列宽
          const buyColWidths = [
            { wch: 12 },  // 股票代码
            { wch: 12 },  // 日期
            { wch: 10 },  // 价格
            { wch: 8 },   // 数量
            { wch: 10 },  // 金额
            { wch: 15 },  // 策略
            { wch: 10 },  // 类型
            { wch: 15 },  // 关联卖出日期
            { wch: 15 }   // 关联卖出价格
          ];
          buyWs['!cols'] = buyColWidths;
          XLSX.utils.book_append_sheet(wb, buyWs, '买入记录');
        }

        // 准备卖出交易数据
        const sellTransactionsData = (backtestResult.sellTransactions || []).map((tx: Transaction) => ({
          '股票代码': stockCode,  // 添加股票代码到每条记录
          '日期': dayjs(tx.date).format('YYYY-MM-DD'),
          '价格($)': tx.price.toFixed(2),
          '数量': tx.quantity,
          '金额($)': tx.amount.toFixed(2),
          '策略': tx.strategy,
          '盈利率(%)': tx.profitRate ? tx.profitRate.toFixed(2) : '',
          '持仓天数': tx.holdingDays || '',
          '关联买入日期': tx.relatedTransactionDate ? dayjs(tx.relatedTransactionDate).format('YYYY-MM-DD') : '',
          '关联买入价格($)': tx.relatedTransactionPrice ? tx.relatedTransactionPrice.toFixed(2) : ''
        }));

        // 创建卖出交易工作表
        if (sellTransactionsData.length > 0) {
          const sellWs = XLSX.utils.json_to_sheet(sellTransactionsData);
          // 设置列宽
          const sellColWidths = [
            { wch: 12 },  // 股票代码
            { wch: 12 },  // 日期
            { wch: 10 },  // 价格
            { wch: 8 },   // 数量
            { wch: 10 },  // 金额
            { wch: 15 },  // 策略
            { wch: 10 },  // 盈利率
            { wch: 10 },  // 持仓天数
            { wch: 15 },  // 关联买入日期
            { wch: 15 }   // 关联买入价格
          ];
          sellWs['!cols'] = sellColWidths;
          XLSX.utils.book_append_sheet(wb, sellWs, '卖出记录');
        }

        // 准备每日资金数据
        const dailyBalancesData = (backtestResult.dailyBalances || []).map((daily: any) => ({
          '股票代码': stockCode,  // 添加股票代码到每条记录
          '日期': dayjs(daily.date).format('YYYY-MM-DD'),
          '累计投入($)': daily.cumulativeInvestment.toFixed(2),
          '账户现金($)': daily.cashBalance.toFixed(2),
          '资产总值($)': daily.totalValue.toFixed(2)
        }));

        // 创建每日资金工作表
        if (dailyBalancesData.length > 0) {
          const dailyWs = XLSX.utils.json_to_sheet(dailyBalancesData);
          // 设置列宽
          const dailyColWidths = [
            { wch: 12 },  // 股票代码
            { wch: 12 },  // 日期
            { wch: 15 },  // 累计投入
            { wch: 15 },  // 账户现金
            { wch: 15 }   // 资产总值
          ];
          dailyWs['!cols'] = dailyColWidths;
          XLSX.utils.book_append_sheet(wb, dailyWs, '每日资金数据');
        }

        // 生成文件名
        const fileName = `${stockCode}_${startDate}_${endDate}_单次回测数据.xlsx`;

        // 保存文件
        XLSX.writeFile(wb, fileName);
        message.success('导出成功！');
      } catch (error) {
        console.error('导出失败:', error);
        message.error('导出失败，请重试');
      }
    };

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
        <Card 
          title="回测结果概览" 
          style={{ marginBottom: 16 }}
          extra={
            <Button type="primary" onClick={exportSingleBacktestToExcel}>
              导出Excel
            </Button>
          }
        >
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

    // 添加导出所有数据到Excel的函数
    const exportAllToExcel = () => {
      try {
        const formValues = formRef.current?.getFieldsValue();
        const stockCode = formValues?.stockCode;

        // 创建工作簿
        const wb = XLSX.utils.book_new();
        
        // 遍历每个时间范围，为每个范围创建一个工作表
        optimizationResults.forEach((result, index) => {
          const dateRange = result.dateRange;
          const sortedResults = [...result.results].sort((a: OptimizationResult, b: OptimizationResult) => 
            b.annualizedReturn - a.annualizedReturn
          );
          
          const startDate = dateRange[0].format('YYYY-MM-DD');
          const endDate = dateRange[1].format('YYYY-MM-DD');
          
          // 准备Excel数据
          const excelData = sortedResults.map(result => ({
            '卖出盈利比例(%)': result.sellProfitPercentage === 9999 ? '不卖出' : result.sellProfitPercentage.toFixed(1),
            '回调买入比例(%)': result.buybackDropPercentage === 9999 ? '不买入' : result.buybackDropPercentage.toFixed(1),
            '年化收益率(%)': result.annualizedReturn.toFixed(2),
            '收益率(%)': result.returnRate.toFixed(2),
            '最大回撤(%)': result.maxDrawdown.toFixed(2),
            '交易次数': result.transactionCount,
            '最终价值($)': result.finalValue.toFixed(2),
            '股票涨跌幅(%)': result.stockReturnRate.toFixed(2),
            '相对股票超额收益(%)': result.excessStockReturn.toFixed(2),
            '指数涨跌幅(%)': result.indexReturnRate.toFixed(2),
            '相对指数超额收益(%)': result.excessIndexReturn.toFixed(2),
          }));

          // 创建工作表
          const ws = XLSX.utils.json_to_sheet(excelData);
          
          // 设置列宽
          const colWidths = [
            { wch: 15 }, // 卖出盈利比例
            { wch: 15 }, // 回调买入比例
            { wch: 15 }, // 年化收益率
            { wch: 12 }, // 收益率
            { wch: 12 }, // 最大回撤
            { wch: 10 }, // 交易次数
            { wch: 15 }, // 最终价值
            { wch: 15 }, // 股票涨跌幅
            { wch: 20 }, // 相对股票超额收益
            { wch: 15 }, // 指数涨跌幅
            { wch: 20 }, // 相对指数超额收益
          ];
          ws['!cols'] = colWidths;

          // 添加工作表到工作簿，使用日期范围作为工作表名称
          XLSX.utils.book_append_sheet(wb, ws, `${startDate}至${endDate}`);
        });

        // 生成文件名
        const fileName = `${stockCode}_所有时间范围_回测数据.xlsx`;

        // 保存文件
        XLSX.writeFile(wb, fileName);
        message.success('导出所有数据成功！');
      } catch (error) {
        console.error('导出失败:', error);
        message.error('导出失败，请重试');
      }
    };

    return (
      <div>
        {optimizationResults.length > 1 && (
          <Card style={{ marginBottom: 16 }}>
            <Button type="primary" onClick={exportAllToExcel}>
              导出全部数据
            </Button>
          </Card>
        )}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {optimizationResults.map((result, index) => {
            const dateRange = result.dateRange;
            const sortedResults = [...result.results].sort((a: OptimizationResult, b: OptimizationResult) => 
              b.annualizedReturn - a.annualizedReturn
            );

            // 添加导出 Excel 函数
            const exportToExcel = (results: OptimizationResult[], dateRange: [Dayjs, Dayjs]) => {
              try {
                // 获取当前表单数据
                const formValues = formRef.current?.getFieldsValue();
                const startDate = dateRange[0].format('YYYYMMDD');
                const endDate = dateRange[1].format('YYYYMMDD');
                const stockCode = formValues?.stockCode;

                // 准备 Excel 数据
                const excelData = results.map(result => ({
                  '卖出盈利比例(%)': result.sellProfitPercentage === 9999 ? '不卖出' : result.sellProfitPercentage.toFixed(1),
                  '回调买入比例(%)': result.buybackDropPercentage === 9999 ? '不买入' : result.buybackDropPercentage.toFixed(1),
                  '年化收益率(%)': result.annualizedReturn.toFixed(2),
                  '收益率(%)': result.returnRate.toFixed(2),
                  '最大回撤(%)': result.maxDrawdown.toFixed(2),
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
              <TabPane 
                tab={`${dateRange[0].format('YYYY-MM-DD')} 至 ${dateRange[1].format('YYYY-MM-DD')}`} 
                key={index.toString()}
              >
                <Card 
                  title="参数优化结果" 
                  style={{ marginBottom: 16 }}
                  extra={
                    <Button type="primary" onClick={() => exportToExcel(sortedResults, dateRange)}>
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
              </TabPane>
            );
          })}
        </Tabs>
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
          rules={[
            { 
              required: true, 
              message: '请选择至少一个策略',
              type: 'array',
              min: 1
            }
          ]}
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

        <Form.List name="dateRanges">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => (
                <Form.Item
                  required={false}
                  key={field.key}
                  label={index === 0 ? "回测时间范围" : ""}
                  extra={index === 0 ? "可以添加多个时间范围进行对比" : ""}
                >
                  <Space align="baseline">
                    <Form.Item
                      {...field}
                      validateTrigger={['onChange', 'onBlur']}
                      rules={[
                        {
                          required: true,
                          message: "请选择回测时间范围",
                        },
                        {
                          validator: async (_, value) => {
                            if (!value || !value[0] || !value[1]) {
                              return Promise.reject('请选择完整的时间范围');
                            }
                            if (value[0].isAfter(value[1])) {
                              return Promise.reject('开始时间不能晚于结束时间');
                            }
                            return Promise.resolve();
                          },
                        },
                      ]}
                      noStyle
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
                          ]
                        }}
                      />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    )}
                  </Space>
                </Form.Item>
              ))}
              {backtestMode === 'optimize' && (
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加时间范围
                  </Button>
                </Form.Item>
              )}
            </>
          )}
        </Form.List>

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
              initialValue={100}
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
              initialValue={40}
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
          <Button 
            type="primary" 
            onClick={() => {
              const form = formRef.current;
              if (form) {
                form.validateFields()
                  .then((values: BacktestFormValues) => {
                    handleSubmit(values);
                  })
                  .catch(({ errorFields }: { errorFields: any[] }) => {
                    console.error('表单验证失败:', errorFields);
                    message.error('请检查表单填写是否正确');
                  });
              }
            }}
            loading={loading}
          >
            {backtestMode === 'single' ? '执行回测' : '最优参数回测'}
          </Button>
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
          initialValues={{
            initialCapital: 100000,
            maxInvestRatio: 1,
            indexCode: 'QQQ',
            sellProfitPercentage: 20,
            buybackDropPercentage: 10,
            sellProfitRangeStart: 10,
            sellProfitRangeEnd: 100,
            sellProfitStep: 5,
            buybackRangeStart: 5,
            buybackRangeEnd: 50,
            buybackStep: 2.5,
            strategies: ['WEEKLY', 'INDEX_DROP', 'CONSECUTIVE_DROP'],
            dateRanges: [
              [
                dayjs().subtract(3, 'year').startOf('year'),
                dayjs().subtract(1, 'year').endOf('year')
              ]
            ]
          }}
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