import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Button, 
  message, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Select, 
  Divider,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd';
import { 
  ReloadOutlined, 
  SettingOutlined, 
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { request } from '@umijs/max';
import { ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormSwitch } from '@ant-design/pro-components';
import { createStrategyStock, listStrategyJob, batchCreateStrategyUserStock, listAccountInfo } from '@/services/ant-design-pro/api';
import moment from 'moment';
import styles from './index.less';

const { Option } = Select;

interface StockMinuteAlert {
  id: number;
  stockCode: string;
  stockName: string;
  alertTime: string;
  triggerPrice: number;
  triggerChangePercent: number;
  triggerVolume?: number;
  currentChangePercent?: number;
  minuteChangePercents: string;
  triggerCondition: string;
  createTime: string;
  updateTime: string;
  marketCap?: number;
  hasStrategyConfig?: boolean; // 是否已配置策略标的
  strategyEnabled?: boolean; // 策略是否已启动
}

interface MinuteCondition {
  minutes: number;
  changePercent: number;
}

interface MarketCapRange {
  minMarketCap: number;
  maxMarketCap: number;
  enabled: boolean;
  changePercentThreshold: number; // 单个涨跌幅阈值
  minAmount: number; // 最少成交金额，单位万美元
}

interface MarketCapFilter {
  enabled: boolean;
  ranges: MarketCapRange[];
}

interface MinuteAlertConfig {
  enabled: boolean;
  conditions: MinuteCondition[];
  marketCapFilter: MarketCapFilter;
}

interface AccountInfo {
  id: number;
  account: string;
  name: string;
  enable: boolean;
}

const StockAlert: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [data, setData] = useState<StockMinuteAlert[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [configVisible, setConfigVisible] = useState(false);
  const [config, setConfig] = useState<MinuteAlertConfig>({
    enabled: true,
    conditions: [],
    marketCapFilter: {
      enabled: false,
      ranges: [
        { minMarketCap: 0, maxMarketCap: 200, enabled: false, changePercentThreshold: 3.0, minAmount: 100 },
        { minMarketCap: 200, maxMarketCap: 1000, enabled: false, changePercentThreshold: 2.5, minAmount: 200 },
        { minMarketCap: 1000, maxMarketCap: 5000, enabled: false, changePercentThreshold: 2.0, minAmount: 500 },
      ]
    }
  });
  const [form] = Form.useForm();
  
  // 搜索条件状态
  const [searchParams, setSearchParams] = useState({
    stockCode: '',
    minMarketCap: null,
    mergeSameStock: true, // 默认合并相同股票数据
    showFirstTriggerTime: true, // 默认显示首次触发时间
  });

  // 生成策略配置相关状态
  const [strategyConfigVisible, setStrategyConfigVisible] = useState(false);
  const [currentStockAlert, setCurrentStockAlert] = useState<StockMinuteAlert | null>(null);
  const [strategyConfigForm] = Form.useForm();
  const [accountOptions, setAccountOptions] = useState<{label: string, value: string, accountInfo: AccountInfo}[]>([]);

  // 获取异动数据
  const fetchData = async (current = 1, size = 20, search = searchParams, sorter?: any) => {
    setLoading(true);
    try {
      const requestData: any = {
        current,
        pageSize: size,
        stockCode: search.stockCode || undefined,
        minMarketCap: search.minMarketCap || undefined,
        mergeSameStock: search.mergeSameStock,
        showFirstTriggerTime: search.showFirstTriggerTime, // 添加showFirstTriggerTime参数
      };

      // 添加排序参数
      if (sorter && sorter.field && sorter.order) {
        requestData.sortKey = sorter.field;
        requestData.sortOrder = sorter.order;
      }

      const response = await request('/api/stock-minute-alert/page', {
        method: 'POST',
        data: requestData,
      });

      if (response.success) {
        setData(response.data.records || []);
        setPagination({
          current: response.data.current,
          pageSize: response.data.size,
          total: response.data.total,
        });
      } else {
        message.error(response.errorMessage || '获取数据失败');
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取配置
  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const response = await request('/api/stock-minute-alert/config', {
        method: 'GET',
      });

      if (response.success) {
        // 确保配置有正确的默认值
        const configData = response.data || {};
        const defaultConfig: MinuteAlertConfig = {
          enabled: true,
          conditions: [],
          marketCapFilter: {
            enabled: false,
            ranges: [
              { minMarketCap: 0, maxMarketCap: 200, enabled: false, changePercentThreshold: 3.0, minAmount: 100 },
              { minMarketCap: 200, maxMarketCap: 1000, enabled: false, changePercentThreshold: 2.5, minAmount: 200 },
              { minMarketCap: 1000, maxMarketCap: 5000, enabled: false, changePercentThreshold: 2.0, minAmount: 500 },
            ]
          }
        };
        
        // 合并服务器返回的配置和默认配置
        const mergedConfig = {
          ...defaultConfig,
          ...configData,
          marketCapFilter: {
            ...defaultConfig.marketCapFilter,
            ...configData.marketCapFilter,
            ranges: configData.marketCapFilter?.ranges || defaultConfig.marketCapFilter.ranges,
          }
        };
        
        setConfig(mergedConfig);
        form.setFieldsValue(mergedConfig);
      } else {
        message.error(response.errorMessage || '获取配置失败');
      }
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  // 获取账户列表
  const fetchAccountOptions = async () => {
    try {
      const response = await listAccountInfo({
        current: 1,
        pageSize: 1000,
        enable: true, // 只获取启用的账户
      }, {});
      
      if (response && response.data) {
        const options = response.data.map((item: AccountInfo) => ({
          label: `${item.account} (${item.name})`,
          value: item.account,
          accountInfo: item,
        }));
        setAccountOptions(options);
      }
    } catch (error) {
      console.error('获取账户列表失败:', error);
    }
  };

  // 保存配置
  const saveConfig = async (values: MinuteAlertConfig) => {
    setConfigLoading(true);
    try {
      console.log('前端发送的配置数据:', JSON.stringify(values, null, 2));
      
      const response = await request('/api/stock-minute-alert/config', {
        method: 'POST',
        data: values,
      });

      if (response.success) {
        message.success('配置保存成功');
        setConfig(values);
        setConfigVisible(false);
      } else {
        message.error(response.errorMessage || '保存配置失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  // 立即运行任务
  const runTask = async () => {
    setRunLoading(true);
    try {
      const response = await request('/api/stock-minute-alert/run-now', {
        method: 'POST',
      });

      if (response.success) {
        message.success(response.data || '任务已启动');
        // 延迟刷新数据
        setTimeout(() => {
          fetchData(pagination.current, pagination.pageSize, searchParams);
        }, 3000);
      } else {
        message.error(response.errorMessage || '启动任务失败');
      }
    } catch (error) {
      message.error('启动任务失败');
    } finally {
      setRunLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchConfig();
    fetchAccountOptions();
  }, []);

  // 处理搜索
  const handleSearch = (values: any) => {
    const newSearchParams = {
      stockCode: values.stockCode || '',
      minMarketCap: values.minMarketCap || null,
      mergeSameStock: values.mergeSameStock !== undefined ? values.mergeSameStock : true,
      showFirstTriggerTime: values.showFirstTriggerTime !== undefined ? values.showFirstTriggerTime : true,
    };
    setSearchParams(newSearchParams);
    fetchData(1, pagination.pageSize, newSearchParams);
  };

  // 重置搜索
  const handleReset = () => {
    const defaultParams = {
      stockCode: '',
      minMarketCap: null,
      mergeSameStock: true,
      showFirstTriggerTime: true,
    };
    setSearchParams(defaultParams);
    fetchData(1, pagination.pageSize, defaultParams);
  };

  // 处理表格变化（分页、排序等）
  const handleTableChange = (page: any, filters: any, sorter: any) => {
    const { current, pageSize } = page;
    fetchData(current, pageSize, searchParams, sorter);
  };

  // 处理生成策略配置
  const handleGenerateStrategy = (record: StockMinuteAlert) => {
    setCurrentStockAlert(record);
    setStrategyConfigVisible(true);
    
    // 根据市值自动判断市值规模
    let marketCapScale = '中盘股'; // 默认值
    if (record.marketCap) {
      if (record.marketCap < 200) {
        marketCapScale = '小盘股';
      } else if (record.marketCap >= 200 && record.marketCap < 1000) {
        marketCapScale = '中盘股';
      } else if (record.marketCap >= 1000) {
        marketCapScale = '大盘股';
      }
    }
    
    // 预填一些默认配置
    strategyConfigForm.setFieldsValue({
      strategyId: 1, // 固定策略ID为1
      stockCode: record.stockCode,
      profitRatio: 1.0, // 默认盈利比例1%
      levelPercent: 1.5, // 默认档位百分比1.5%
      unsoldStackLimit: 2, // 默认未卖出堆栈值
      totalFundShares: 5, // 默认最大持有买入单数
      limitStartShares: 5, // 默认限制开始单数
      enableOpeningBuy: true, // 默认开启开盘买入
      marketCapScale: marketCapScale, // 根据市值自动设置
      enableProfitSellBeforeClose: 'PROFIT_SELL_BEFORE_CLOSE', // 默认收盘前盈利卖出
      enableYesterdayLowestBuy: false, // 默认关闭昨天最低价买入
      status: '1', // 默认启用
      // 应用用户默认配置
      selectedAccounts: [], // 默认不选择任何用户
      userStockStatus: '1', // 默认启用用户股票关系
      // 添加默认时间配置
      startTime: '09:35', // 默认开始时间
      endTime: '15:00', // 默认结束时间
      cooldownTime: 30, // 默认买入冷却时间30分钟
      // 默认时段配置
      timeSegmentMaConfig: [
        { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1.0 },
        { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1.0 },
        { timeSegment: '13:30', maBelowPercent: 2.0, maAbovePercent: -2.0, profitPercent: 1.5 },
      ],
    });
  };

  // 处理策略启动/停止控制
  const handleStrategyControl = async (stockCode: string, enabled: boolean) => {
    try {
      const response = await request(`/api/stock-minute-alert/strategy-control/${stockCode}/${enabled}`, {
        method: 'POST',
      });

      if (response.success) {
        message.success(response.data || `策略${enabled ? '启用' : '禁用'}成功`);
        // 刷新数据
        fetchData(pagination.current, pagination.pageSize, searchParams);
      } else {
        message.error(response.errorMessage || `策略${enabled ? '启用' : '禁用'}失败`);
      }
    } catch (error) {
      message.error(`策略${enabled ? '启用' : '禁用'}失败`);
    }
  };

  // 保存策略配置
  const handleSaveStrategyConfig = async (values: any) => {
    try {
      console.log('提交的原始表单数据:', values);
      
      // 检查该股票是否已经存在配置
      const checkResponse = await request('/api/strategy/stock/page', {
        method: 'GET',
        params: {
          current: 1,
          pageSize: 10,
          strategyId: values.strategyId,
          stockCode: values.stockCode,
        },
      });

      if (checkResponse.success && checkResponse.data.records && checkResponse.data.records.length > 0) {
        message.warning(intl.formatMessage({ id: 'pages.stockAlert.generateStrategy.exists' }));
        return false;
      }

      // 将百分比值转换为小数
      const processedValues: any = {
        strategyId: values.strategyId,
        strategyName: '反弹上方高位震荡策略', // 策略ID为1对应的策略名称
        stockCode: values.stockCode,
        profitRatio: values.profitRatio / 100,
        levelPercent: values.levelPercent / 100,
        maBelowPercent: values.maBelowPercent / 100,
        maAbovePercent: values.maAbovePercent / 100,
        intraUpPullbackPercent: values.intraUpPullbackPercent / 100,
        intraDnBelowAvgPercent: values.intraDnBelowAvgPercent / 100,
        // 时间和整数字段保持原值
        intraUpDurationMinutes: values.intraUpDurationMinutes,
        intraDnDurationMinutes: values.intraDnDurationMinutes,
        unsoldStackLimit: values.unsoldStackLimit,
        totalFundShares: values.totalFundShares,
        limitStartShares: values.limitStartShares,
        // 布尔和枚举字段
        enableOpeningBuy: values.enableOpeningBuy,
        marketCapScale: values.marketCapScale,
        enableProfitSellBeforeClose: values.enableProfitSellBeforeClose,
        enableYesterdayLowestBuy: values.enableYesterdayLowestBuy,
        status: values.status,
      };

      // 处理时段配置
      if (values.timeSegmentMaConfig && values.timeSegmentMaConfig.length > 0) {
        // 验证时间段格式
        const timeSegments = values.timeSegmentMaConfig.map((item: any) => item.timeSegment);
        const uniqueTimeSegments = [...new Set(timeSegments)];
        
        if (uniqueTimeSegments.length !== timeSegments.length) {
          message.error('时段配置中存在重复的时间段');
          return false;
        }
        
        // 验证时段格式
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        for (const item of values.timeSegmentMaConfig) {
          if (!timeRegex.test(item.timeSegment)) {
            message.error(`时段 ${item.timeSegment} 格式不正确，请使用 HH:mm 格式`);
            return false;
          }
        }
        
        // 按时间排序并转换百分比为小数
        const timeToMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        const sortedConfig = values.timeSegmentMaConfig
          .sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment))
          .map((item: any) => ({
            timeSegment: item.timeSegment,
            maBelowPercent: item.maBelowPercent / 100,
            maAbovePercent: item.maAbovePercent / 100,
            profitPercent: item.profitPercent / 100,
          }));
        
        processedValues.timeSegmentMaConfig = JSON.stringify(sortedConfig);
      }

      // 添加默认买入比例配置
      const defaultBuyRatioConfig = {
        firstShareRatio: 3.0,
        extraShares: [
          { drop: 7, ratio: 3, secondStage: false },
          { drop: 7, ratio: 3, secondStage: false },
          { drop: 9, ratio: 4.6, secondStage: false },
          { drop: 9, ratio: 4.6, secondStage: false },
          { drop: 9, ratio: 4.6, secondStage: false },
          { drop: 11, ratio: 6, secondStage: true },
          { drop: 11, ratio: 7.7, secondStage: false },
        ]
      };
      processedValues.buyRatioConfig = JSON.stringify(defaultBuyRatioConfig);

      console.log('处理后的提交数据:', processedValues);

      // 调用创建策略标的API
      const response = await createStrategyStock(processedValues);
      console.log('API响应:', response);
      
      // 批量创建策略用户股票关系（现在是必选的）
      try {
        const batchCreateParams = {
          strategyId: values.strategyId,
          strategyName: '反弹上方高位震荡策略',
          accounts: values.selectedAccounts,
          stockCodes: [values.stockCode],
          maxAmount: values.maxAmount || 80000, // 使用最大金额，默认80000美元
          status: values.userStockStatus || '1',
          startTime: values.startTime || '10:00',
          endTime: values.endTime || '16:00',
          timeZone: 'America/New_York',
          cooldownTime: values.cooldownTime || 30,
          unsoldStackLimit: values.unsoldStackLimit || 4,
          limitStartShares: values.limitStartShares || 9,
          totalFundShares: values.totalFundShares || 18,
          profitRatio: values.profitRatio / 100,
          enableOpeningBuy: values.enableOpeningBuy ? 1 : 0, // 转换boolean为Integer
        };

        console.log('批量创建用户股票关系参数:', batchCreateParams);
        
        const batchResult = await batchCreateStrategyUserStock(batchCreateParams);
        console.log('批量创建用户股票关系响应:', batchResult);
        
        if (batchResult && batchResult.data) {
          const { successCount, failureCount, errorMessages } = batchResult.data;
          
          if (failureCount > 0) {
            message.warning(
              `策略配置创建成功！用户股票关系：成功 ${successCount}，失败 ${failureCount}。${
                errorMessages.length > 0 ? `错误信息：${errorMessages.join('; ')}` : ''
              }`
            );
          } else {
            message.success(`策略配置和用户股票关系创建成功！共配置 ${successCount} 个用户。`);
          }
        } else {
          message.success('策略配置和用户股票关系创建成功！');
        }
      } catch (batchError: any) {
        console.error('批量创建用户股票关系失败:', batchError);
        message.error(`策略配置创建成功，但用户股票关系创建失败：${batchError.message || '未知错误'}`);
      }
      
      setStrategyConfigVisible(false);
      strategyConfigForm.resetFields();
      return true;
    } catch (error: any) {
      console.error('生成策略配置失败:', error);
      message.error(`生成策略配置失败: ${error.message || '未知错误'}`);
      return false;
    }
  };

  // 解析分钟涨跌幅
  const parseMinuteChangePercents = (minuteChangePercents: string) => {
    try {
      return JSON.parse(minuteChangePercents);
    } catch {
      return {};
    }
  };

  // 表格列定义
  const columns = [
    {
      title: <FormattedMessage id="pages.stockAlert.stockCode" defaultMessage="股票" />,
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 80,
      render: (text: string) => (
        <Tag 
          color="blue" 
          style={{ cursor: 'pointer' }}
          onClick={() => window.open(`https://www.futunn.com/stock/${text}-US`, '_blank')}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: <FormattedMessage id="pages.stockAlert.marketCap" defaultMessage="市值" />,
      dataIndex: 'marketCap',
      key: 'marketCap',
      width: 80,
      render: (marketCap: number) => marketCap ? `${marketCap.toLocaleString()}亿` : '-',
      sorter: (a: StockMinuteAlert, b: StockMinuteAlert) => a.marketCap! - b.marketCap!,
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerChange" defaultMessage="触发时涨跌幅" />,
      dataIndex: 'triggerChangePercent',
      key: 'triggerChangePercent',
      width: 100,
      render: (percent: number) => {
        const color = percent >= 0 ? '#ff4d4f' : '#52c41a';
        return <span style={{ color }}>{percent?.toFixed(2)}%</span>;
      },
      sorter: (a: StockMinuteAlert, b: StockMinuteAlert) => a.triggerChangePercent - b.triggerChangePercent,
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerVolume" defaultMessage="触发时成交量" />,
      dataIndex: 'triggerVolume',
      key: 'triggerVolume',
      width: 90,
      render: (volume: number) => volume ? volume.toLocaleString() : '-',
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerAmount" defaultMessage="触发时总成交金额" />,
      key: 'triggerAmount',
      width: 90,
      render: (_: any, record: StockMinuteAlert) => {
        if (record.triggerPrice && record.triggerVolume) {
          const amount = record.triggerPrice * record.triggerVolume;
          // 格式化为中文单位，大于万时显示万，大于亿时显示亿
          if (amount >= 100000000) { // 大于等于1亿
            return `${(amount / 100000000).toFixed(0)}亿`;
          } else if (amount >= 10000) { // 大于等于1万
            return `${(amount / 10000).toFixed(0)}万`;
          } else {
            return `${amount.toLocaleString()}`;
          }
        }
        return '-';
      },
    },
    {
      title: <FormattedMessage id="pages.stockAlert.currentChange" defaultMessage="当前涨跌幅" />,
      dataIndex: 'currentChangePercent',
      key: 'currentChangePercent',
      width: 120,
      render: (percent: number) => {
        if (percent === null || percent === undefined) {
          return <span style={{ color: '#999' }}>获取中...</span>;
        }
        const color = percent >= 0 ? '#ff4d4f' : '#52c41a';
        return <span style={{ color }}>{percent?.toFixed(2)}%</span>;
      },
    },
    {
      title: <FormattedMessage id="pages.stockAlert.minuteChanges" defaultMessage="触发时N分钟涨跌幅" />,
      dataIndex: 'minuteChangePercents',
      key: 'minuteChangePercents',
      width: 150,
      render: (text: string) => {
        const changes = parseMinuteChangePercents(text);
        
        // 将对象转换为数组并按分钟数排序
        const sortedEntries = Object.entries(changes).sort((a, b) => {
          // 从键名中提取分钟数（如"1min" -> 1, "5min" -> 5）
          const minutesA = parseInt(a[0].replace('min', ''));
          const minutesB = parseInt(b[0].replace('min', ''));
          return minutesA - minutesB;
        });
        
        return (
          <Space wrap>
            {sortedEntries.map(([period, data]: [string, any]) => {
              // 兼容旧格式（纯数字）和新格式（对象）
              const changePercent = typeof data === 'object' ? data.changePercent : data;
              const volume = typeof data === 'object' ? data.volume : null;
              const color = changePercent >= 0 ? 'red' : 'green';
              
              return (
                <Tag key={period} color={color}>
                  {period}: {changePercent?.toFixed(2)}%
                  {volume !== null && volume !== undefined && (
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      Vol: {volume.toLocaleString()}
                    </div>
                  )}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerCondition" defaultMessage="触发条件" />,
      dataIndex: 'triggerCondition',
      key: 'triggerCondition',
      width: 200,
      render: (text: string) => {
        if (!text) return '-';
        
        // 将分号分隔的条件转换为数组，每个条件一行
        const conditions = text.split('; ').filter(condition => condition.trim());
        
        return (
          <div style={{ 
            fontSize: '12px',
            lineHeight: '1.5',
            maxWidth: '350px',
          }}>
            {conditions.map((condition, index) => (
              <div key={index} style={{ 
                marginBottom: index < conditions.length - 1 ? '4px' : '0',
                wordBreak: 'break-all',
                whiteSpace: 'normal',
              }}>
                • {condition.trim()}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerTime" defaultMessage="触发时间" />,
      dataIndex: 'alertTime',
      key: 'alertTime',
      width: 180,
      render: (time: string) => moment(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: StockMinuteAlert, b: StockMinuteAlert) => moment(a.alertTime).valueOf() - moment(b.alertTime).valueOf(),
    },
    {
      title: <FormattedMessage id="pages.stockAlert.action" defaultMessage="操作" />,
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: StockMinuteAlert) => (
        <Space size="small">
          {!record.hasStrategyConfig ? (
            <Tooltip title={intl.formatMessage({ id: 'pages.stockAlert.generateStrategy' })}>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleGenerateStrategy(record)}
              >
                <FormattedMessage id="pages.stockAlert.generateStrategy" defaultMessage="生成策略" />
              </Button>
            </Tooltip>
          ) : (
            <>
              {record.strategyEnabled ? (
                <Tooltip title="停止策略">
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleStrategyControl(record.stockCode, false)}
                  >
                    停止
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title="启动策略">
                  <Button
                    type="primary"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleStrategyControl(record.stockCode, true)}
                  >
                    启动
                  </Button>
                </Tooltip>
              )}
              <Tooltip title="已配置策略">
                <Button
                  size="small"
                  disabled
                  icon={<PlusOutlined />}
                >
                  已配置
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card 
        title={
          <Space>
            <ExclamationCircleOutlined />
            <FormattedMessage id="menu.list.stock-alert" defaultMessage="股票异动" />
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={runLoading}
              onClick={runTask}
            >
              <FormattedMessage id="pages.stockAlert.runNow" defaultMessage="立即运行" />
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setConfigVisible(true)}
            >
              <FormattedMessage id="pages.stockAlert.config" defaultMessage="配置" />
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => fetchData(pagination.current, pagination.pageSize, searchParams)}
            >
              <FormattedMessage id="pages.stockAlert.refresh" defaultMessage="刷新" />
            </Button>
          </Space>
        }
      >
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title={<FormattedMessage id="pages.stockAlert.totalAlerts" defaultMessage="总异动数" />}
              value={pagination.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<FormattedMessage id="pages.stockAlert.todayAlerts" defaultMessage="今日异动" />}
              value={data.filter(item => 
                moment(item.alertTime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
              ).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<FormattedMessage id="pages.stockAlert.alertStatus" defaultMessage="告警启用状态" />}
              value={config.enabled ? '启用' : '禁用'}
              valueStyle={{ color: config.enabled ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<FormattedMessage id="pages.stockAlert.enabledThresholds" defaultMessage="启用的涨跌幅阈值" />}
              value={config.marketCapFilter.ranges
                ?.filter(r => r.enabled)
                ?.map(r => `${r.minMarketCap}-${r.maxMarketCap}亿 (${r.changePercentThreshold}%)`)
                ?.join('; ') || '无'}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        {/* 搜索表单 */}
        <Card style={{ marginBottom: 16 }}>
          <Form 
            layout="inline" 
            onFinish={handleSearch}
            initialValues={searchParams}
            style={{ marginBottom: 0 }}
          >
            <Form.Item 
              name="stockCode" 
              label={<FormattedMessage id="pages.stockAlert.search.stockCode" defaultMessage="股票代码" />}
            >
              <Input 
                placeholder={intl.formatMessage({
                  id: 'pages.stockAlert.search.stockCode.placeholder',
                  defaultMessage: '请输入股票代码'
                })}
                allowClear
                style={{ width: 200 }}
              />
            </Form.Item>
            
            <Form.Item 
              name="minMarketCap" 
              label={<FormattedMessage id="pages.stockAlert.search.minMarketCap" defaultMessage="市值大于" />}
            >
              <InputNumber 
                placeholder={intl.formatMessage({
                  id: 'pages.stockAlert.search.minMarketCap.placeholder',
                  defaultMessage: '请输入最小市值'
                })}
                min={0}
                style={{ width: 200 }}
                addonAfter="亿美元"
              />
            </Form.Item>
            
            <Form.Item 
              name="mergeSameStock" 
              label={<FormattedMessage id="pages.stockAlert.search.mergeSameStock" defaultMessage="合并相同股票" />}
              valuePropName="checked"
            >
              <Switch 
                checkedChildren={intl.formatMessage({
                  id: 'pages.stockAlert.search.mergeSameStock.on',
                  defaultMessage: '开启'
                })}
                unCheckedChildren={intl.formatMessage({
                  id: 'pages.stockAlert.search.mergeSameStock.off',
                  defaultMessage: '关闭'
                })}
              />
            </Form.Item>
            
            <Form.Item 
              name="showFirstTriggerTime" 
              label={<FormattedMessage id="pages.stockAlert.search.showFirstTriggerTime" defaultMessage="显示首次触发时间" />}
              valuePropName="checked"
            >
              <Switch 
                checkedChildren={intl.formatMessage({
                  id: 'pages.stockAlert.search.showFirstTriggerTime.on',
                  defaultMessage: '首次'
                })}
                unCheckedChildren={intl.formatMessage({
                  id: 'pages.stockAlert.search.showFirstTriggerTime.off',
                  defaultMessage: '最新'
                })}
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  <FormattedMessage id="pages.stockAlert.search.search" defaultMessage="搜索" />
                </Button>
                <Button onClick={handleReset}>
                  <FormattedMessage id="pages.stockAlert.search.reset" defaultMessage="重置" />
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: (current, size) => {
              fetchData(current, size, searchParams);
            },
          }}
          scroll={{ x: 800 }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 配置弹窗 */}
      <Modal
        title={intl.formatMessage({ id: 'pages.stockAlert.configModalTitle', defaultMessage: '纳斯达克股票异动分析配置' })}
        open={configVisible}
        onCancel={() => setConfigVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          onFinish={saveConfig}
          layout="vertical"
          initialValues={{
            enabled: config.enabled,
            conditions: config.conditions || [],
            marketCapFilter: {
              enabled: config.marketCapFilter?.enabled || false,
              ranges: config.marketCapFilter?.ranges || [
                { minMarketCap: 0, maxMarketCap: 200, enabled: false, changePercentThreshold: 3.0, minAmount: 100 },
                { minMarketCap: 200, maxMarketCap: 1000, enabled: false, changePercentThreshold: 2.5, minAmount: 200 },
                { minMarketCap: 1000, maxMarketCap: 5000, enabled: false, changePercentThreshold: 2.0, minAmount: 500 },
              ]
            }
          }}
        >
          <Form.Item
            name="enabled"
            label={<FormattedMessage id="pages.stockAlert.enableAlert" defaultMessage="启用告警功能" />}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider><FormattedMessage id="pages.stockAlert.minuteConditions" defaultMessage="分钟级别告警条件" /></Divider>
          <Form.List name="conditions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} style={{ alignItems: 'center' }}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'minutes']}
                        label={<FormattedMessage id="pages.stockAlert.minutes" defaultMessage="分钟数" />}
                        rules={[{ required: true, message: '请输入分钟数' }]}
                      >
                        <InputNumber min={1} max={60} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'changePercent']}
                        label={<FormattedMessage id="pages.stockAlert.changeThreshold" defaultMessage="涨跌幅阈值 (%)" />}
                        rules={[{ required: true, message: '请输入涨跌幅阈值' }]}
                      >
                        <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button 
                        type="link" 
                        danger 
                        onClick={() => remove(name)}
                        style={{ marginTop: 30 }}
                      >
                        <FormattedMessage id="pages.stockAlert.marketCapRange.delete" defaultMessage="删除" />
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    <FormattedMessage id="pages.stockAlert.addCondition" defaultMessage="添加条件" />
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider><FormattedMessage id="pages.stockAlert.marketCapFilter" defaultMessage="市值筛选配置" /></Divider>
          <Form.Item
            name={['marketCapFilter', 'enabled']}
            label={<FormattedMessage id="pages.stockAlert.enableMarketCap" defaultMessage="启用市值筛选" />}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['marketCapFilter', 'ranges']}
            label={<FormattedMessage id="pages.stockAlert.marketCapRanges" defaultMessage="市值范围配置" />}
            rules={[{ required: true, message: '请设置市值范围' }]}
          >
            <Form.List name={['marketCapFilter', 'ranges']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ 
                      border: '1px solid #e8e8e8', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      marginBottom: '16px',
                      backgroundColor: '#fafafa'
                    }}>
                      <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'minMarketCap']}
                            label={<FormattedMessage id="pages.stockAlert.minMarketCap" defaultMessage="最小市值 (亿美元)" />}
                            rules={[{ required: true, message: '请输入最小市值' }]}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'maxMarketCap']}
                            label={<FormattedMessage id="pages.stockAlert.maxMarketCap" defaultMessage="最大市值 (亿美元)" />}
                            rules={[{ required: true, message: '请输入最大市值' }]}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'changePercentThreshold']}
                            label={<FormattedMessage id="pages.stockAlert.thresholdPercent" defaultMessage="涨跌幅阈值 (%)" />}
                            rules={[{ required: true, message: '请输入涨跌幅阈值' }]}
                          >
                            <InputNumber 
                              min={0} 
                              max={100} 
                              step={0.1} 
                              style={{ width: '100%' }}
                              addonAfter="%"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'minAmount']}
                            label={<FormattedMessage id="pages.stockAlert.minAmount" defaultMessage="最少成交金额 (万美元)" />}
                            rules={[{ required: true, message: '请输入最少成交金额' }]}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'enabled']}
                            label={<FormattedMessage id="pages.stockAlert.marketCapRange.enable" defaultMessage="启用" />}
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Button 
                            type="link" 
                            danger 
                            onClick={() => remove(name)}
                            style={{ marginTop: 30 }}
                          >
                            <FormattedMessage id="pages.stockAlert.marketCapRange.delete" defaultMessage="删除" />
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add({ 
                      minMarketCap: 0, 
                      maxMarketCap: 1000, 
                      enabled: false, 
                      changePercentThreshold: 3.0, 
                      minAmount: 100 
                    })} block>
                      <FormattedMessage id="pages.stockAlert.addMarketCapRange" defaultMessage="添加市值范围" />
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={configLoading}>
                <FormattedMessage id="pages.stockAlert.saveConfig" defaultMessage="保存配置" />
              </Button>
              <Button onClick={() => setConfigVisible(false)}>
                <FormattedMessage id="pages.stockAlert.cancel" defaultMessage="取消" />
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成策略配置弹窗 */}
      <ModalForm
        title={<FormattedMessage id="pages.stockAlert.generateStrategy.title" defaultMessage="生成策略配置" />}
        open={strategyConfigVisible}
        onOpenChange={setStrategyConfigVisible}
        onFinish={handleSaveStrategyConfig}
        form={strategyConfigForm}
        layout="vertical"
        width={800}
        modalProps={{
          destroyOnClose: true,
          footer: null,
        }}
        submitter={false}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="strategyId"
              label="策略ID"
              disabled
              initialValue={1}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="stockCode"
              label="股票代码"
              rules={[{ required: true }]}
              readonly
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="profitRatio"
              label="盈利比例 (%)"
              tooltip="止盈设置的盈利比例（百分比，如10表示10%）"
              min={0}
              max={100}
              fieldProps={{
                step: 0.01,
                precision: 2,
                addonAfter: '%',
              }}
              rules={[{ required: true }]}
            />
          </div>


          

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="unsoldStackLimit"
              label="未卖出堆栈值"
              tooltip="每天允许的最大开放买入订单数"
              min={1}
              max={20}
              fieldProps={{
                step: 1,
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="limitStartShares"
              label="限制开始单数"
              tooltip="从第几档开始限制买入，默认9"
              min={1}
              max={100}
              fieldProps={{
                step: 1,
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="totalFundShares"
              label="最大持有买入单数"
              tooltip="资金分割的总档位数，默认18"
              min={1}
              max={100}
              fieldProps={{
                step: 1,
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="levelPercent"
              label="开盘矩阵单档位百分比(%)"
              tooltip="开盘矩阵单每档买入的百分比，例如1.5表示1.5%"
              min={0}
              max={100}
              fieldProps={{
                step: 0.01,
                precision: 2,
                addonAfter: '%',
              }}
              rules={[{ required: true }]}
            />
          </div>



          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSwitch
              name="enableOpeningBuy"
              label="是否开盘买入"
              tooltip="是否在开盘时执行买入策略"
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="marketCapScale"
              label="市值规模"
              tooltip="根据当前股票市值自动判断：小盘股(<200亿)、中盘股(200-1000亿)、大盘股(≥1000亿)"
              options={[
                { label: '小盘股', value: '小盘股' },
                { label: '中盘股', value: '中盘股' },
                { label: '大盘股', value: '大盘股' },
                { label: 'ETF', value: 'ETF' },
              ]}
              placeholder="请选择市值规模"
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="enableProfitSellBeforeClose"
              label="收盘前盈利卖出"
              tooltip="收盘前盈利卖出策略"
              options={[
                { label: '收盘前总盈利卖出', value: 'PROFIT_SELL_BEFORE_CLOSE' },
                { label: '收盘前全部卖出', value: 'ALL_SELL_BEFORE_CLOSE' },
                { label: '不卖出', value: 'NO_SELL' },
              ]}
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSwitch
              name="enableYesterdayLowestBuy"
              label="昨天最低价买入"
              tooltip="是否在股票价格接近昨天最低价时触发买入信号"
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="status"
              label="状态"
              options={[
                { label: '启用', value: '1' },
                { label: '禁用', value: '0' },
              ]}
              rules={[{ required: true }]}
            />
          </div>
        </div>

        {/* 时段配置区域 */}
        <Divider>时段配置</Divider>
        <Form.Item
          label="时段配置"
          tooltip="不同时段的分时平均线买入配置，可动态增删"
        >
          <Form.List name="timeSegmentMaConfig">
            {(timeSegmentFields, { add: addTimeSegment, remove: removeTimeSegment }) => (
              <>
                {timeSegmentFields.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '20px', 
                    backgroundColor: '#f9f9f9', 
                    borderRadius: '6px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ marginBottom: '12px', color: '#666' }}>暂无时段配置</div>
                    <Button 
                      type="primary" 
                      onClick={() => {
                        const defaultSegments = [
                          { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1.0 },
                          { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1.0 },
                          { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1.0 },
                        ];
                        strategyConfigForm.setFieldsValue({ timeSegmentMaConfig: defaultSegments });
                      }}
                      icon={<ThunderboltOutlined />}
                    >
                      生成默认时间段
                    </Button>
                  </div>
                )}
                
                {timeSegmentFields.map((field) => (
                  <div key={field.key} style={{ 
                    display: 'flex', 
                    alignItems: 'flex-end', 
                    gap: '16px', 
                    marginBottom: 16, 
                    padding: '12px', 
                    border: '1px solid #e8e8e8', 
                    borderRadius: '6px',
                    backgroundColor: '#fafafa'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>时段开始时间</div>
                      <Form.Item 
                        {...field} 
                        name={[field.name, 'timeSegment']} 
                        rules={[
                          { required: true, message: '时段必填' },
                          { 
                            pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                            message: '时间格式错误，请使用HH:mm格式（如09:30）'
                          }
                        ]}
                        style={{ margin: 0 }}
                      >
                        <Input placeholder="09:30" />
                      </Form.Item>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>下方百分比</div>
                      <Form.Item 
                        {...field} 
                        name={[field.name, 'maBelowPercent']} 
                        rules={[{ required: true, message: '下方百分比必填' }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber
                          placeholder="0.5"
                          min={-100}
                          max={100}
                          precision={2}
                          addonAfter="%"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>上方百分比</div>
                      <Form.Item 
                        {...field} 
                        name={[field.name, 'maAbovePercent']} 
                        rules={[{ required: true, message: '上方百分比必填' }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber
                          placeholder="0.1"
                          min={-100}
                          max={100}
                          precision={2}
                          addonAfter="%"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>盈利点</div>
                      <Form.Item 
                        {...field} 
                        name={[field.name, 'profitPercent']} 
                        rules={[{ required: true, message: '盈利点必填' }]}
                        style={{ margin: 0 }}
                      >
                        <InputNumber
                          placeholder="1.0"
                          min={-100}
                          max={100}
                          precision={2}
                          addonAfter="%"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeTimeSegment(field.name)}
                        size="small"
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  type="dashed"
                  onClick={() => addTimeSegment({ timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1.0 })}
                  icon={<PlusOutlined />}
                  style={{ width: '100%' }}
                >
                  添加时段
                </Button>
              </>
            )}
          </Form.List>
        </Form.Item>

        <div style={{ fontSize: '12px', color: '#666', marginTop: 16, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 4 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>时段配置说明：</div>
          <div>
            • 时段格式：HH:mm（如 09:30），支持00:00-23:59<br/>
            • 下方%：股价低于分时平均线该百分比时买入，可为负数<br/>
            • 上方%：股价高于分时平均线该百分比时买入，可为负数<br/>
            • 盈利点：股价高于分时平均线该百分比时买入，可为负数<br/>
            • 系统会自动检查时间段重复并按时间顺序排序<br/>
            • 默认时间段：09:30(0.5%,0.1%,1.0%), 12:00(1.0%,-0.5%,1.0%), 14:00(1.5%,-1.0%,1.0%)
          </div>
        </div>

        {/* 应用用户配置区域 */}
        <Divider>应用用户配置</Divider>
        <div style={{ fontSize: '12px', color: '#666', marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4 }}>
          <div style={{ fontWeight: 'bold', marginBottom: 4 }}>应用用户说明：</div>
          <div>
            • 选择应用用户：选择将此策略配置应用到哪些用户账户，必须至少选择一个<br/>
            • 单用户最大金额：每个用户账户在此股票上的最大投入金额（美元）<br/>
            • 策略开始时间：策略每日开始生效的时间（美东时间），格式HH:mm<br/>
            • 策略结束时间：策略每日停止生效的时间（美东时间），格式HH:mm<br/>
            • 买入冷却时间：相邻两次买入之间的最小间隔时间（分钟）<br/>
            • 用户股票关系状态：控制用户股票关系的启用状态
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ width: '100%' }}>
            <ProFormSelect
              name="selectedAccounts"
              label="应用用户"
              mode="multiple"
              placeholder="请选择应用用户（可多选）"
              options={accountOptions}
              tooltip="选择将此策略配置应用到哪些用户账户，必须至少选择一个用户"
              rules={[
                { required: true, message: '请至少选择一个用户账户' },
                { type: 'array', min: 1, message: '请至少选择一个用户账户' }
              ]}
            />
            {/* 全选和清空按钮 */}
            <div style={{ marginTop: '8px', marginBottom: '16px' }}>
              <Space>
                <Button 
                  size="small" 
                  onClick={() => {
                    const allAccountValues = accountOptions.map(option => option.value);
                    strategyConfigForm.setFieldsValue({ selectedAccounts: allAccountValues });
                  }}
                >
                  全选用户
                </Button>
                <Button 
                  size="small" 
                  onClick={() => {
                    strategyConfigForm.setFieldsValue({ selectedAccounts: [] });
                  }}
                >
                  清空选择
                </Button>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  共 {accountOptions.length} 个用户可选
                </span>
              </Space>
            </div>
          </div>

          <div style={{ width: 'calc(50% - 4px)' }}>
            <ProFormDigit
              name="maxAmount"
              label="单用户最大金额"
              tooltip="每个用户账户在此股票上的最大投入金额（美元），与资金百分比互斥，优先使用最大金额"
              min={0}
              initialValue={80000}
              fieldProps={{
                step: 100,
                precision: 0,
                addonAfter: '$',
              }}
            />
          </div>

          <div style={{ width: 'calc(50% - 4px)' }}>
            <ProFormSelect
              name="userStockStatus"
              label="用户股票关系状态"
              options={[
                { label: '启用', value: '1' },
                { label: '禁用', value: '0' },
              ]}
              tooltip="控制用户股票关系的启用状态"
            />
          </div>

          <div style={{ width: 'calc(50% - 4px)' }}>
            <ProFormText
              name="startTime"
              label="策略开始时间"
              tooltip="策略生效的开始时间，格式 HH:mm，例如 09:40"
              placeholder="09:40"
              rules={[
                { required: true, message: '请输入策略开始时间' },
                { 
                  pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                  message: '时间格式错误，请使用HH:mm格式（如09:40）'
                }
              ]}
            />
          </div>

          <div style={{ width: 'calc(50% - 4px)' }}>
            <ProFormText
              name="endTime"
              label="策略结束时间"
              tooltip="策略生效的结束时间，格式 HH:mm，例如 15:00"
              placeholder="15:00"
              rules={[
                { required: true, message: '请输入策略结束时间' },
                { 
                  pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                  message: '时间格式错误，请使用HH:mm格式（如15:00）'
                }
              ]}
            />
          </div>

          <div style={{ width: 'calc(50% - 4px)' }}>
            <ProFormDigit
              name="cooldownTime"
              label="买入冷却时间 (分钟)"
              tooltip="策略触发后，再次买入该股票的冷却时间（分钟），例如 30"
              min={0}
              max={1440}
              fieldProps={{
                addonAfter: '分钟',
                style: { width: '100%' },
              }}
              rules={[{ required: true, message: '请输入买入冷却时间' }]}
            />
          </div>
        </div>

        {/* 底部按钮区域 */}
        <div style={{ marginTop: '24px', textAlign: 'left' }}>
          <Button 
            onClick={() => setStrategyConfigVisible(false)}
            style={{ marginRight: '8px' }}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            onClick={async () => {
              try {
                // 先验证表单
                const values = await strategyConfigForm.validateFields();
                console.log('表单验证通过，获取到的值:', JSON.stringify(values, null, 2));
                
                // 手动调用handleSaveStrategyConfig
                const success = await handleSaveStrategyConfig(values);
                if (success) {
                  setStrategyConfigVisible(false);
                  strategyConfigForm.resetFields();
                }
              } catch (error) {
                console.error('表单验证失败:', error);
              }
            }}
          >
            确定
          </Button>
        </div>
      </ModalForm>
    </div>
  );
};

export default StockAlert; 