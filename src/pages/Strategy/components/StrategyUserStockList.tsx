import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState, useMemo } from 'react';
import { Button, message, Popconfirm, Space, Tag, Tooltip, Switch, Select, DatePicker, Modal, Checkbox, Dropdown, Menu, InputNumber, Input, Card, Statistic, Row, Col } from 'antd';
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProFormSwitch,
  ProFormDatePicker,
  ProTable,
  ProFormList,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { PlusOutlined, InfoCircleOutlined, FilterOutlined, CloseCircleOutlined, QuestionCircleOutlined, SaveOutlined, ThunderboltOutlined, DownOutlined } from '@ant-design/icons';
import { 
  listStrategyUserStock, 
  createStrategyUserStock, 
  batchCreateStrategyUserStock,
  updateStrategyUserStock, 
  deleteStrategyUserStock,
  listAccount,
  listStrategyJob,
  updateStrategyUserStockStatus,
  updateStrategyUserStockOpeningBuy,
  batchUpdateStrategyUserStockOpeningBuy,
  updateStrategyUserStockSecondStage,
  batchUpdateStrategyUserStockStatus,
  batchUpdateStrategyUserStockProfitRatio,
  batchUpdateStrategyUserStockTime,
  batchUpdateStrategyUserStockUnsoldStackLimit,
  batchUpdateStrategyUserStockLimitStartShares,
  batchUpdateStrategyUserStockTotalFundShares,
  saveConfigTemplate,
  applyConfigTemplate,
  getConfigTemplateList,
  deleteConfigTemplate,
  listStrategyStock,
  listAccountInfo,
} from '@/services/ant-design-pro/api';

interface StrategyUserStockListProps {
  strategyId?: number;
  strategyName?: string;
  onClearStrategy?: () => void;
}

/**
 * 策略用户股票关系列表组件
 */
const StrategyUserStockList = forwardRef((props: StrategyUserStockListProps, ref) => {
  const { strategyId, strategyName, onClearStrategy } = props;
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [batchCreateModalVisible, setBatchCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.StrategyUserStockItem>();
  const [strategyOptions, setStrategyOptions] = useState<{label: string, value: number}[]>([]);
  const [accountOptions, setAccountOptions] = useState<{label: string, value: string}[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [saveTemplateModalVisible, setSaveTemplateModalVisible] = useState<boolean>(false);
  const [applyTemplateModalVisible, setApplyTemplateModalVisible] = useState<boolean>(false);
  const [templates, setTemplates] = useState<API.StrategyConfigTemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number>();
  const [templateInitialValues, setTemplateInitialValues] = useState<any>({});
  const [strategyStockMap, setStrategyStockMap] = useState<Map<string, API.StrategyStockItem>>(new Map());
  const [accountTotalAmountMap, setAccountTotalAmountMap] = useState<Map<string, number>>(new Map());
  const [batchTimeModalVisible, setBatchTimeModalVisible] = useState<boolean>(false);
  const [batchTimeType, setBatchTimeType] = useState<'start' | 'end' | 'both'>('start');
  const [batchStartTime, setBatchStartTime] = useState<string>('10:00');
  const [batchEndTime, setBatchEndTime] = useState<string>('16:00');
  const [batchUnsoldStackLimit, setBatchUnsoldStackLimit] = useState<number>(5);
  const [batchLimitStartShares, setBatchLimitStartShares] = useState<number>(9);
  const [batchTotalFundShares, setBatchTotalFundShares] = useState<number>(18);
  const [batchUnsoldStackModalVisible, setBatchUnsoldStackModalVisible] = useState<boolean>(false);
  const [batchLimitStartModalVisible, setBatchLimitStartModalVisible] = useState<boolean>(false);
  const [batchTotalFundModalVisible, setBatchTotalFundModalVisible] = useState<boolean>(false);
  const [selectedAccountsInfo, setSelectedAccountsInfo] = useState<API.AccountInfo[]>([]);
  const [selectedAccountsStocks, setSelectedAccountsStocks] = useState<API.StrategyUserStockItem[]>([]);
  const [currentTableData, setCurrentTableData] = useState<API.StrategyUserStockItem[]>([]);
  const actionRef = useRef<ActionType>();
  const createFormRef = useRef<any>();
  const batchCreateFormRef = useRef<any>();
  const updateFormRef = useRef<any>();
  const saveTemplateFormRef = useRef<any>();
  const searchFormRef = useRef<any>();
  const intl = useIntl();
  
  // 公开刷新方法
  useImperativeHandle(ref, () => ({
    reload: () => {
      actionRef.current?.reload();
    },
  }));

  // 默认的BuyRatioConfig配置
  const getDefaultBuyRatioConfig = () => ({
    firstShareRatio: 3.0,
    extraShares: [
      { drop: 7, ratio: 3, secondStage: false },
      { drop: 7, ratio: 3, secondStage: false },
      { drop: 9, ratio: 4.6, secondStage: false },
      { drop: 9, ratio: 4.6, secondStage: false },
      { drop: 11, ratio: 6, secondStage: false },
      { drop: 11, ratio: 6, secondStage: false },
      { drop: 11, ratio: 7.7, secondStage: false }
    ]
  });

  // 解析BuyRatioConfig
  const parseBuyRatioConfig = (buyRatioConfigStr?: string) => {
    if (!buyRatioConfigStr) {
      return getDefaultBuyRatioConfig();
    }
    try {
      return JSON.parse(buyRatioConfigStr);
    } catch (error) {
      console.warn('解析BuyRatioConfig失败，使用默认配置:', error);
      return getDefaultBuyRatioConfig();
    }
  };

  // 计算单次资金
  const calculateSingleAmount = (record: API.StrategyUserStockItem, buyRatioConfig: any) => {
    if (!record.maxAmount) return 0;
    const firstShareRatio = (buyRatioConfig.firstShareRatio || 3.0) / 100;
    return record.maxAmount * firstShareRatio;
  };

  // 计算单天最大持有资金
  const calculateDailyMaxHolding = (record: API.StrategyUserStockItem, singleAmount: number) => {
    const unsoldStackLimit = record.unsoldStackLimit || 4;
    return singleAmount * unsoldStackLimit;
  };

  // 计算最大持有资金
  const calculateMaxHolding = (record: API.StrategyUserStockItem, buyRatioConfig: any, singleAmount: number) => {
    if (!record.maxAmount) return 0;
    const limitStartShares = record.limitStartShares || 9;
    const totalFundShares = record.totalFundShares || 18;
    const extraShares = buyRatioConfig.extraShares || [];
    
    // 第一部分：单次资金 * limitStartShares
    const firstPart = singleAmount * limitStartShares;
    
    // 第二部分：计算额外份数的比例总和
    const extraSharesCount = totalFundShares - limitStartShares;
    let extraRatioSum = 0;
    
    for (let i = 0; i < Math.min(extraSharesCount, extraShares.length); i++) {
      extraRatioSum += (extraShares[i].ratio || 0) / 100;
    }
    
    const secondPart = record.maxAmount * extraRatioSum;
    
    return firstPart + secondPart;
  };

  // 获取策略股票配置
  const getStrategyStockConfig = (strategyId?: number, stockCode?: string) => {
    if (!strategyId || !stockCode) return null;
    const key = `${strategyId}_${stockCode}`;
    return strategyStockMap.get(key) || null;
  };

  // 加载策略任务列表和账户列表
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
          setStrategyOptions(options);
        }
        
        // 获取账户列表
        const accountRes = await listAccount({});
        if (accountRes && accountRes.data) {
          const options = accountRes.data.map((item: any) => ({
            label: `${item.account} (${item.name})`,
            value: item.account,
          }));
          setAccountOptions(options);
        }
      } catch (error) {
        console.error('获取选项数据失败:', error);
      }
    };
    
    fetchOptions();
  }, []);

  // 获取策略股票配置数据
  useEffect(() => {
    const fetchStrategyStockData = async () => {
      try {
        // 获取所有策略股票配置
        const strategyStockRes = await listStrategyStock({
          current: 1,
          pageSize: 1000, // 获取足够多的数据
        });
        
        if (strategyStockRes && strategyStockRes.data) {
          const newMap = new Map<string, API.StrategyStockItem>();
          strategyStockRes.data.forEach((item: API.StrategyStockItem) => {
            if (item.strategyId && item.stockCode) {
              const key = `${item.strategyId}_${item.stockCode}`;
              newMap.set(key, item);
            }
          });
          setStrategyStockMap(newMap);
        }

        // 获取所有账户的总资金信息
        const accountDetailRes = await listAccountInfo({
          current: 1,
          pageSize: 1000,
        }, {});
        
        if (accountDetailRes && accountDetailRes.data) {
          const newAccountTotalAmountMap = new Map<string, number>();
          accountDetailRes.data.forEach((account: API.AccountInfo) => {
            if (account.account && account.totalAmount) {
              newAccountTotalAmountMap.set(account.account, account.totalAmount);
            }
          });
          setAccountTotalAmountMap(newAccountTotalAmountMap);
        }
      } catch (error) {
        console.error('获取策略股票配置数据或账户资金数据失败:', error);
      }
    };
    
    fetchStrategyStockData();
  }, []);

  // 添加策略用户股票关系
  const handleAdd = async (fields: any) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.creating' }));
    
    // 如果有选择策略，则使用选定的策略ID和名称
    if (strategyId) {
      fields.strategyId = strategyId;
      fields.strategyName = strategyName;
    }
    
    // 将百分比值转换为小数
    if (fields.fundPercent) {
      fields.fundPercent = fields.fundPercent / 100;
    }
    
    // 将盈利比例百分比值转换为小数
    if (fields.profitRatio) {
      fields.profitRatio = fields.profitRatio / 100;
    }
    
    // 处理开盘买入字段
    if (fields.enableOpeningBuy === 'true') {
      fields.enableOpeningBuy = true;
    } else if (fields.enableOpeningBuy === 'false') {
      fields.enableOpeningBuy = false;
    } else {
      fields.enableOpeningBuy = undefined;
    }
    
    // 根据设置的字段设置相应的null值
    if (fields.maxAmount && fields.maxAmount > 0) {
      // 如果设置了最大金额，将资金百分比设为undefined
      fields.fundPercent = undefined;
    } else if (fields.fundPercent && fields.fundPercent > 0) {
      // 如果设置了资金百分比，将最大金额设为undefined
      fields.maxAmount = undefined;
    }
    
    try {
      await createStrategyUserStock(fields);
      hide();
      message.success(intl.formatMessage({ id: 'pages.message.created' }));
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(intl.formatMessage({ id: 'pages.message.createFailed' }));
      return false;
    }
  };

  // 批量创建策略用户股票关系
  const handleBatchCreate = async (fields: any) => {
    const hide = message.loading('正在批量创建...');
    
    try {
      // 如果有选择策略，则使用选定的策略ID和名称
      if (strategyId) {
        fields.strategyId = strategyId;
        fields.strategyName = strategyName;
      }
      // 如果没有预选策略，检查表单中是否有策略选择
      else if (fields.strategyId) {
        // 表单中的strategyName应该已经通过onChange事件设置了
        if (!fields.strategyName) {
          // 如果没有策略名称，从策略选项中查找
          const strategyOption = strategyOptions.find(option => option.value === fields.strategyId);
          if (strategyOption) {
            fields.strategyName = strategyOption.label.split(' (ID:')[0]; // 提取策略名称
          }
        }
      }
      
      // 处理股票代码数组 - 从ProFormList的格式转换为字符串数组
      if (fields.stockCodes && Array.isArray(fields.stockCodes)) {
        fields.stockCodes = fields.stockCodes
          .map((item: any) => item.code || item)
          .filter((code: string) => code && code.trim())
          .map((code: string) => code.trim().toUpperCase());
      }
      
      // 将百分比值转换为小数
      if (fields.fundPercent) {
        fields.fundPercent = fields.fundPercent / 100;
      }
      
      // 将盈利比例百分比值转换为小数
      if (fields.profitRatio) {
        fields.profitRatio = fields.profitRatio / 100;
      }
      
      // 处理开盘买入字段
      if (fields.enableOpeningBuy === 'true') {
        fields.enableOpeningBuy = true;
      } else if (fields.enableOpeningBuy === 'false') {
        fields.enableOpeningBuy = false;
      } else {
        fields.enableOpeningBuy = undefined;
      }
      
      // 根据设置的字段设置相应的null值
      if (fields.maxAmount && fields.maxAmount > 0) {
        // 如果设置了最大金额，将资金百分比设为undefined
        fields.fundPercent = undefined;
      } else if (fields.fundPercent && fields.fundPercent > 0) {
        // 如果设置了资金百分比，将最大金额设为undefined
        fields.maxAmount = undefined;
      }
      
      const result = await batchCreateStrategyUserStock(fields);
      hide();
      
      if (result && result.data) {
        const { successCount, failureCount, errorMessages } = result.data;
        
        if (failureCount > 0) {
          message.warning(
            `批量创建完成！成功：${successCount}，失败：${failureCount}。${
              errorMessages.length > 0 ? `错误信息：${errorMessages.join('; ')}` : ''
            }`
          );
        } else {
          message.success(`批量创建成功！共创建 ${successCount} 条记录。`);
        }
      } else {
        message.success('批量创建成功！');
      }
      
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error(`批量创建失败：${error.message || '未知错误'}`);
      return false;
    }
  };

  // 更新策略用户股票关系
  const handleUpdate = async (fields: any) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.updating' }));
    
    if (!currentRow) {
      return false;
    }
    
    // 将百分比值转换为小数
    if (fields.fundPercent) {
      fields.fundPercent = fields.fundPercent / 100;
    }
    
    // 将盈利比例百分比值转换为小数
    if (fields.profitRatio) {
      fields.profitRatio = fields.profitRatio / 100;
    }
    
    // 处理开盘买入字段
    if (fields.enableOpeningBuy === 'true') {
      fields.enableOpeningBuy = true;
    } else if (fields.enableOpeningBuy === 'false') {
      fields.enableOpeningBuy = false;
    } else {
      fields.enableOpeningBuy = undefined;
    }
    
    // 根据设置的字段设置相应的null值
    if (fields.maxAmount && fields.maxAmount > 0) {
      // 如果设置了最大金额，将资金百分比设为undefined
      fields.fundPercent = undefined;
    } else if (fields.fundPercent && fields.fundPercent > 0) {
      // 如果设置了资金百分比，将最大金额设为undefined
      fields.maxAmount = undefined;
    }
    
    try {
      await updateStrategyUserStock({
        ...currentRow,
        ...fields,
      });
      hide();
      message.success(intl.formatMessage({ id: 'pages.message.updated' }));
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(intl.formatMessage({ id: 'pages.message.updateFailed' }));
      return false;
    }
  };

  // 删除策略用户股票关系
  const handleDelete = async (record: API.StrategyUserStockItem) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.deleting' }));
    
    try {
      await deleteStrategyUserStock(record);
      hide();
      message.success(intl.formatMessage({ id: 'pages.message.deleted' }));
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(intl.formatMessage({ id: 'pages.message.deleteFailed' }));
      return false;
    }
  };

  // 更新策略用户股票关系状态
  const handleUpdateStatus = async (id: number, status: string) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.updating' }));
    
    try {
      await updateStrategyUserStockStatus({ id, status });
      hide();
      message.success(intl.formatMessage({ id: 'pages.message.updated' }));
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(intl.formatMessage({ id: 'pages.message.updateFailed' }));
      return false;
    }
  };

  // 更新策略用户股票关系开盘买入状态
  const handleUpdateOpeningBuy = async (id: number, enableOpeningBuy: boolean | null) => {
    console.log('handleUpdateOpeningBuy 调用:', { id, enableOpeningBuy });
    const hide = message.loading('更新中...');
    
    try {
      const result = await updateStrategyUserStockOpeningBuy({ id, enableOpeningBuy });
      console.log('API调用结果:', result);
      hide();
      message.success('更新成功');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      console.error('API调用错误:', error);
      hide();
      message.error('更新失败');
      return false;
    }
  };

  // 批量更新策略用户股票关系开盘买入状态
  const handleBatchUpdateOpeningBuy = async (enableOpeningBuy: boolean | null) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    const hide = message.loading('批量更新中...');
    
    try {
      const result = await batchUpdateStrategyUserStockOpeningBuy({ 
        ids: selectedRowKeys as number[], 
        enableOpeningBuy 
      });
      hide();
      message.success(`已成功更新 ${selectedRowKeys.length} 条记录`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('批量更新失败');
      return false;
    }
  };

  // 批量更新策略用户股票关系状态
  const handleBatchUpdateStatus = async (status: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    const hide = message.loading('批量更新状态中...');
    
    try {
      const result = await batchUpdateStrategyUserStockStatus({ 
        ids: selectedRowKeys as number[], 
        status 
      });
      hide();
      message.success(`已成功更新 ${selectedRowKeys.length} 条记录的状态`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('批量更新状态失败');
      return false;
    }
  };

  // 批量更新策略用户股票关系盈利比例
  const handleBatchUpdateProfitRatio = async (profitRatio: number) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    const hide = message.loading('批量更新盈利比例中...');
    
    try {
      // 将百分比转换为小数
      const profitRatioDecimal = profitRatio / 100;
      const result = await batchUpdateStrategyUserStockProfitRatio({ 
        ids: selectedRowKeys as number[], 
        profitRatio: profitRatioDecimal 
      });
      hide();
      message.success(`已成功更新 ${selectedRowKeys.length} 条记录的盈利比例为 ${profitRatio}%`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('批量更新盈利比例失败');
      return false;
    }
  };

  // 批量更新策略用户股票关系开始结束时间
  const handleBatchUpdateTime = async (startTime?: string, endTime?: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    if (!startTime && !endTime) {
      message.warning('请至少设置开始时间或结束时间');
      return;
    }

    try {
      const ids = selectedRowKeys.map(key => Number(key));
      await batchUpdateStrategyUserStockTime({
        ids,
        startTime,
        endTime,
      });
      message.success('批量更新时间成功');
      actionRef.current?.reload();
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('批量更新时间失败:', error);
      message.error('批量更新时间失败');
    }
  };

  // 处理批量时间设置确认
  const handleBatchTimeConfirm = () => {
    let startTime: string | undefined;
    let endTime: string | undefined;
    
    if (batchTimeType === 'start' || batchTimeType === 'both') {
      startTime = batchStartTime;
    }
    if (batchTimeType === 'end' || batchTimeType === 'both') {
      endTime = batchEndTime;
    }
    
    handleBatchUpdateTime(startTime, endTime);
    setBatchTimeModalVisible(false);
  };

  // 批量更新未卖出堆栈值
  const handleBatchUpdateUnsoldStackLimit = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    try {
      const ids = selectedRowKeys.map(key => Number(key));
      await batchUpdateStrategyUserStockUnsoldStackLimit({
        ids,
        unsoldStackLimit: batchUnsoldStackLimit,
      });
      message.success('批量更新未卖出堆栈值成功');
      actionRef.current?.reload();
      setSelectedRowKeys([]);
      setBatchUnsoldStackModalVisible(false);
    } catch (error) {
      console.error('批量更新未卖出堆栈值失败:', error);
      message.error('批量更新未卖出堆栈值失败');
    }
  };

  // 批量更新限制开始份数
  const handleBatchUpdateLimitStartShares = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    try {
      const ids = selectedRowKeys.map(key => Number(key));
      await batchUpdateStrategyUserStockLimitStartShares({
        ids,
        limitStartShares: batchLimitStartShares,
      });
      message.success('批量更新限制开始份数成功');
      actionRef.current?.reload();
      setSelectedRowKeys([]);
      setBatchLimitStartModalVisible(false);
    } catch (error) {
      console.error('批量更新限制开始份数失败:', error);
      message.error('批量更新限制开始份数失败');
    }
  };

  // 批量更新最大持有买入单数
  const handleBatchUpdateTotalFundShares = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    try {
      const ids = selectedRowKeys.map(key => Number(key));
      await batchUpdateStrategyUserStockTotalFundShares({
        ids,
        totalFundShares: batchTotalFundShares,
      });
      message.success('批量更新最大持有买入单数成功');
      actionRef.current?.reload();
      setSelectedRowKeys([]);
      setBatchTotalFundModalVisible(false);
    } catch (error) {
      console.error('批量更新最大持有买入单数失败:', error);
      message.error('批量更新最大持有买入单数失败');
    }
  };

  // 加载模版列表
  const loadTemplates = async () => {
    try {
      const response = await getConfigTemplateList({ configType: 'user_stock' });
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('加载模版列表失败:', error);
    }
  };

  // 保存配置模版
  const handleSaveTemplate = async (values: any) => {
    if (selectedRowKeys.length === 0) {
      message.error('请先选择要保存的配置');
      return false;
    }

    if (selectedRowKeys.length > 1) {
      message.error('保存模版时只能选择一个配置');
      return false;
    }

    // 检查模版名称是否重复
    try {
      const response = await getConfigTemplateList({ configType: 'user_stock' });
      if (response.success && response.data) {
        const existingTemplate = response.data.find((template: API.StrategyConfigTemplateItem) => 
          template.name === values.name
        );
        if (existingTemplate) {
          message.error(`模版名称"${values.name}"已存在，请使用其他名称`);
          return false;
        }
      }
    } catch (error) {
      console.error('检查模版名称重复时出错:', error);
    }

    const hide = message.loading('保存模版中...');
    try {
      await saveConfigTemplate({
        name: values.name,
        applicableScenario: values.applicableScenario,
        marketCondition: values.marketCondition,
        volatilityRange: values.volatilityRange,
        strategyId: values.strategyId,
        sourceStockCode: values.sourceStockCode,
        minMarketCap: values.minMarketCap,
        maxMarketCap: values.maxMarketCap,
        configType: 'user_stock',
        sourceId: selectedRowKeys[0] as number,
      });
      hide();
      message.success('模版保存成功');
      setSaveTemplateModalVisible(false);
      setSelectedRowKeys([]);
      return true;
    } catch (error) {
      hide();
      message.error('模版保存失败');
      return false;
    }
  };

  // 应用配置模版
  const handleApplyTemplate = async () => {
    if (!selectedTemplate) {
      message.error('请选择要应用的模版');
      return;
    }

    if (selectedRowKeys.length === 0) {
      message.error('请选择要应用配置的目标');
      return;
    }

    const hide = message.loading('应用模版中...');
    try {
      await applyConfigTemplate({
        id: selectedTemplate,
        targetIds: selectedRowKeys as number[],
        configType: 'user_stock',
        overwrite: true,
      });
      hide();
      message.success(`模版已应用到 ${selectedRowKeys.length} 个配置`);
      setApplyTemplateModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedTemplate(undefined);
      actionRef.current?.reload();
    } catch (error) {
      hide();
      message.error('模版应用失败');
    }
  };

  // 删除模版
  const handleDeleteTemplate = async (id: number) => {
    const hide = message.loading('删除中...');
    try {
      await deleteConfigTemplate(id);
      hide();
      message.success('模版删除成功');
      loadTemplates();
    } catch (error: any) {
      hide();
      // 显示详细的错误信息
      const errorMessage = error?.response?.data?.message || error?.message || '模版删除失败';
      message.error({
        content: errorMessage,
        duration: 6, // 显示6秒，因为错误信息可能比较长
        style: {
          whiteSpace: 'pre-line', // 支持换行显示
        },
      });
    }
  };

  // 保存单个记录为模版
  const handleSaveAsTemplate = (record: API.StrategyUserStockItem) => {
    // 设置模版初始值
    const initialValues = {
      strategyId: record.strategyId,
      sourceStockCode: record.stockCode,
      name: `${record.stockCode}_${record.accountName}_模版`,
    };
    setTemplateInitialValues(initialValues);
    setSaveTemplateModalVisible(true);
    // 临时设置选中的行，用于保存模版
    setSelectedRowKeys([record.id!]);
  };

  // 处理用户账号选择后的自动查询
  const handleAccountsChange = async (selectedAccounts: string[]) => {
    if (!selectedAccounts || selectedAccounts.length === 0) {
      setSelectedAccountsInfo([]);
      setSelectedAccountsStocks([]);
      return;
    }

    try {
      // 查询选中账户的详细信息
      const accountDetailRes = await listAccountInfo({
        current: 1,
        pageSize: 1000,
      }, {});
      
      if (accountDetailRes && accountDetailRes.data) {
        const selectedAccountsData = accountDetailRes.data.filter((account: API.AccountInfo) => 
          selectedAccounts.includes(account.account)
        );
        setSelectedAccountsInfo(selectedAccountsData);
      }

      // 查询选中账户已有的股票配置
      const userStockPromises = selectedAccounts.map(account => 
        listStrategyUserStock({
          current: 1,
          pageSize: 1000,
          account: account,
        })
      );
      
      const userStockResults = await Promise.all(userStockPromises);
      const allUserStocks: API.StrategyUserStockItem[] = [];
      
      userStockResults.forEach(result => {
        if (result && result.data) {
          allUserStocks.push(...result.data);
        }
      });
      
      setSelectedAccountsStocks(allUserStocks);
    } catch (error) {
      console.error('查询账户信息失败:', error);
      message.error('查询账户信息失败');
    }
  };

  // 计算汇总数据
  const calculateSummaryData = () => {
    let totalSingleAmount = 0;
    let totalDailyMaxHolding = 0;
    let totalMaxHolding = 0;

    currentTableData.forEach(record => {
      const strategyStockConfig = getStrategyStockConfig(record.strategyId, record.stockCode);
      const buyRatioConfig = parseBuyRatioConfig(strategyStockConfig?.buyRatioConfig);
      
      // 计算单次资金
      const singleAmount = calculateSingleAmount(record, buyRatioConfig);
      totalSingleAmount += singleAmount;
      
      // 计算单天最大持有资金
      const dailyMaxHolding = calculateDailyMaxHolding(record, singleAmount);
      totalDailyMaxHolding += dailyMaxHolding;
      
      // 计算最大持有资金
      const maxHolding = calculateMaxHolding(record, buyRatioConfig, singleAmount);
      totalMaxHolding += maxHolding;
    });

    return {
      totalSingleAmount,
      totalDailyMaxHolding,
      totalMaxHolding,
      recordCount: currentTableData.length,
    };
  };

  // 使用useMemo优化汇总数据计算
  const summaryData = useMemo(() => {
    let totalSingleAmount = 0;
    let totalDailyMaxHolding = 0;
    let totalMaxHolding = 0;
    const accountsSet = new Set<string>();
    const stockAmountMap = new Map<string, number>(); // 股票代码 -> 总资金

    currentTableData.forEach(record => {
      const strategyStockConfig = getStrategyStockConfig(record.strategyId, record.stockCode);
      const buyRatioConfig = parseBuyRatioConfig(strategyStockConfig?.buyRatioConfig);
      
      // 计算单次资金
      const singleAmount = calculateSingleAmount(record, buyRatioConfig);
      totalSingleAmount += singleAmount;
      
      // 计算单天最大持有资金
      const dailyMaxHolding = calculateDailyMaxHolding(record, singleAmount);
      totalDailyMaxHolding += dailyMaxHolding;
      
      // 计算最大持有资金
      const maxHolding = calculateMaxHolding(record, buyRatioConfig, singleAmount);
      totalMaxHolding += maxHolding;
      
      // 收集账户信息
      if (record.account) {
        accountsSet.add(record.account);
      }
      
      // 统计每个股票的资金占用（使用最大持有资金）
      if (record.stockCode) {
        const currentAmount = stockAmountMap.get(record.stockCode) || 0;
        stockAmountMap.set(record.stockCode, currentAmount + maxHolding);
      }
    });

    // 计算所有涉及账户的总资金
    let totalAccountAmount = 0;
    accountsSet.forEach(account => {
      const accountAmount = accountTotalAmountMap.get(account) || 0;
      totalAccountAmount += accountAmount;
    });

    // 计算占比
    const singleAmountRatio = totalAccountAmount > 0 ? (totalSingleAmount / totalAccountAmount) * 100 : 0;
    const dailyMaxHoldingRatio = totalAccountAmount > 0 ? (totalDailyMaxHolding / totalAccountAmount) * 100 : 0;
    const maxHoldingRatio = totalAccountAmount > 0 ? (totalMaxHolding / totalAccountAmount) * 100 : 0;

    // 找出资金占用最大的股票
    let maxStockCode = '';
    let maxStockAmount = 0;
    let maxStockRatio = 0;
    
    stockAmountMap.forEach((amount, stockCode) => {
      if (amount > maxStockAmount) {
        maxStockAmount = amount;
        maxStockCode = stockCode;
        maxStockRatio = totalAccountAmount > 0 ? (amount / totalAccountAmount) * 100 : 0;
      }
    });

    return {
      totalSingleAmount,
      totalDailyMaxHolding,
      totalMaxHolding,
      totalAccountAmount,
      singleAmountRatio,
      dailyMaxHoldingRatio,
      maxHoldingRatio,
      recordCount: currentTableData.length,
      accountCount: accountsSet.size,
      maxStockCode,
      maxStockRatio,
    };
  }, [currentTableData, strategyStockMap, accountTotalAmountMap]);

  // 表格列定义
  const columns: ProColumns<API.StrategyUserStockItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.strategy.job.name" defaultMessage="Strategy" />,
      dataIndex: 'strategyName',
      sorter: true,
      valueType: 'select',
      fieldProps: {
        options: strategyOptions,
        showSearch: true,
        filterOption: (input: string, option: any) => 
          option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0,
      },
      formItemProps: {
        name: 'strategyId',
      },
      width: 150,
    },
    {
      title: <FormattedMessage id="pages.strategy.user.stockRelation.account" defaultMessage="Account" />,
      dataIndex: 'account',
      sorter: true,
      valueType: 'select',
      fieldProps: {
        options: accountOptions,
        showSearch: true,
        filterOption: (input: string, option: any) => 
          option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0,
        onChange: (value: string) => {
          // 当用户选择账户后，自动触发查询
          if (value) {
            // 延迟一点时间确保搜索表单已更新，然后触发查询
            setTimeout(() => {
              searchFormRef.current?.submit();
              actionRef.current?.reload();
            }, 100);
          }
        },
      },
    },
    {
      title: <FormattedMessage id="pages.strategy.user.stockRelation.accountName" defaultMessage="Account Name" />,
      dataIndex: 'accountName',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.strategy.user.stockRelation.stockCode" defaultMessage="Stock Code" />,
      dataIndex: 'stockCode',
      sorter: true,
      render: (text, record) => (
        <a
          onClick={() => {
            // 跳转到策略标的页面，并传递参数以便自动打开编辑弹窗
            if (record.strategyId && record.stockCode) {
              // 使用 window.location.hash 或者路由跳转
              const url = `/strategy?tab=2&strategyId=${record.strategyId}&editStockCode=${record.stockCode}`;
              window.location.href = url;
            }
          }}
          style={{ color: '#1890ff', cursor: 'pointer' }}
        >
          {text}
        </a>
      ),
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.user.stockRelation.fundPercent" defaultMessage="Fund Percent" />
          <Tooltip title={<FormattedMessage id="pages.strategy.user.stockRelation.fundPercentTip" defaultMessage="Percentage of funds allocated to this stock (mutually exclusive with Max Amount)" />}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'fundPercent',
      valueType: 'percent',
      hideInSearch: true,
      render: (_, record) => record.fundPercent ? `${(record.fundPercent * 100).toFixed(1)}%` : '-',
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.user.stockRelation.maxAmount" defaultMessage="Max Amount" />
          <Tooltip title={<FormattedMessage id="pages.strategy.user.stockRelation.maxAmountTip" defaultMessage="Maximum amount allocated to this stock (mutually exclusive with Fund Percent)" />}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'maxAmount',
      valueType: 'money',
      hideInSearch: true,
      render: (_, record) => record.maxAmount ? `$${record.maxAmount.toLocaleString()}` : '-',
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.user.stockRelation.dailyCompletedOrders" defaultMessage="每日最大完成单数" />
          <Tooltip title={<FormattedMessage id="pages.strategy.user.stockRelation.dailyCompletedOrdersTip" defaultMessage="每天最大完成单数限制，当当天已完成订单数量达到这个值时，将停止下单" />}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'dailyCompletedOrders',
      valueType: 'digit',
      hideInSearch: true,
      render: (text, record) => {
        if (record.dailyCompletedOrders === null || record.dailyCompletedOrders === undefined) {
          return '-';
        }
        return record.dailyCompletedOrders;
      },
    },
    {
      title: (
        <span>
          <>未卖出堆栈值</>
          <Tooltip title="限制当天同一股票在同一策略下最多允许的未卖出买入订单数">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'unsoldStackLimit',
      valueType: 'digit',
      hideInSearch: true,
      render: (text, record) => {
        if (record.unsoldStackLimit === null || record.unsoldStackLimit === undefined) {
          return '4';
        }
        return record.unsoldStackLimit;
      },
    },
    {
      title: (
        <span>
          <>限制开始份数</>
          <Tooltip title="从第几份开始限制买入，默认为9">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'limitStartShares',
      valueType: 'digit',
      hideInSearch: true,
      render: (text, record) => {
        if (record.limitStartShares === null || record.limitStartShares === undefined) {
          return '9';
        }
        return record.limitStartShares;
      },
    },
    {
      title: (
        <span>
          <>最大持有买入单数</>
          <Tooltip title="最大持有买入单数">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'totalFundShares',
      valueType: 'digit',
      hideInSearch: true,
      render: (text, record) => {
        if (record.totalFundShares === null || record.totalFundShares === undefined) {
          return '18';
        }
        return record.totalFundShares;
      },
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.user.stockRelation.cooldownTime" defaultMessage="买入冷却时间(分钟)" />
          <Tooltip title={<FormattedMessage id="pages.strategy.user.stockRelation.cooldownTimeTip" defaultMessage="两次相邻买入之间的冷却时间，单位分钟，默认30分钟" />}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'cooldownTime',
      valueType: 'digit',
      hideInSearch: true,
      render: (text, record) => {
        if (record.cooldownTime === null || record.cooldownTime === undefined) {
          return '30';
        }
        return record.cooldownTime;
      },
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.user.stockRelation.profitRatio" defaultMessage="盈利比例" />
          <Tooltip title={<FormattedMessage id="pages.strategy.user.stockRelation.profitRatioTip" defaultMessage="用户自定义的盈利比例，如果设置了该值，策略将优先使用此比例进行止盈" />}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'profitRatio',
      valueType: 'percent',
      hideInSearch: true,
      render: (_, record) => record.profitRatio ? `${(record.profitRatio * 100).toFixed(2)}%` : '-',
    },
    {
      title: (
        <span>
          <>单次资金</>
          <Tooltip title="单次买入资金 = 最大金额 × 首次份额比例">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'singleAmount',
      valueType: 'money',
      hideInSearch: true,
      render: (_, record) => {
        const strategyStockConfig = getStrategyStockConfig(record.strategyId, record.stockCode);
        const buyRatioConfig = parseBuyRatioConfig(strategyStockConfig?.buyRatioConfig);
        const singleAmount = calculateSingleAmount(record, buyRatioConfig);
        return singleAmount > 0 ? `$${singleAmount.toLocaleString()}` : '-';
      },
    },
    {
      title: (
        <span>
          <>单天最大持有资金</>
          <Tooltip title="单天最大持有资金 = 单次资金 × 未卖出堆栈值">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'dailyMaxHolding',
      valueType: 'money',
      hideInSearch: true,
      render: (_, record) => {
        const strategyStockConfig = getStrategyStockConfig(record.strategyId, record.stockCode);
        const buyRatioConfig = parseBuyRatioConfig(strategyStockConfig?.buyRatioConfig);
        const singleAmount = calculateSingleAmount(record, buyRatioConfig);
        const dailyMaxHolding = calculateDailyMaxHolding(record, singleAmount);
        
        if (dailyMaxHolding <= 0) return '-';
        
        // 获取账户总资金
        const accountTotalAmount = record.account ? accountTotalAmountMap.get(record.account) : undefined;
        let percentageText = '';
        
        if (accountTotalAmount && accountTotalAmount > 0) {
          const percentage = (dailyMaxHolding / accountTotalAmount) * 100;
          percentageText = ` (${percentage.toFixed(2)}%)`;
        }
        
        return `$${dailyMaxHolding.toLocaleString()}${percentageText}`;
      },
    },
    {
      title: (
        <span>
          <>最大持有资金</>
          <Tooltip title="最大持有资金 = 单次资金 × 限制开始份数 + 最大金额 × 额外份数比例总和">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'maxHolding',
      valueType: 'money',
      hideInSearch: true,
      render: (_, record) => {
        const strategyStockConfig = getStrategyStockConfig(record.strategyId, record.stockCode);
        const buyRatioConfig = parseBuyRatioConfig(strategyStockConfig?.buyRatioConfig);
        const singleAmount = calculateSingleAmount(record, buyRatioConfig);
        const maxHolding = calculateMaxHolding(record, buyRatioConfig, singleAmount);
        
        if (maxHolding <= 0) return '-';
        
        // 获取账户总资金
        const accountTotalAmount = record.account ? accountTotalAmountMap.get(record.account) : undefined;
        let percentageText = '';
        
        if (accountTotalAmount && accountTotalAmount > 0) {
          const percentage = (maxHolding / accountTotalAmount) * 100;
          percentageText = ` (${percentage.toFixed(2)}%)`;
        }
        
        return `$${maxHolding.toLocaleString()}${percentageText}`;
      },
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.user.stockRelation.startTime" defaultMessage="开始时间" />
          <Tooltip title={<FormattedMessage id="pages.strategy.user.stockRelation.startTimeTip" defaultMessage="策略开始执行时间（基于设置的时区）" />}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'startTime',
      valueType: 'time',
      hideInSearch: true,
      render: (_, record) => record.startTime || '10:00',
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.user.stockRelation.endTime" defaultMessage="结束时间" />
          <Tooltip title={<FormattedMessage id="pages.strategy.user.stockRelation.endTimeTip" defaultMessage="策略结束执行时间（基于设置的时区）" />}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'endTime',
      valueType: 'time',
      hideInSearch: true,
      render: (_, record) => record.endTime || '16:00',
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.user.stockRelation.timeZone" defaultMessage="时区" />
          <Tooltip title={<FormattedMessage id="pages.strategy.user.stockRelation.timeZoneTip" defaultMessage="策略执行的时区，默认为美东时区" />}>
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'timeZone',
      valueType: 'select',
      hideInSearch: true,
      valueEnum: {
        'America/New_York': <FormattedMessage id="pages.strategy.user.stockRelation.timeZone.newyork" defaultMessage="美东时区" />,
        'Asia/Shanghai': <FormattedMessage id="pages.strategy.user.stockRelation.timeZone.shanghai" defaultMessage="北京时区" />,
      },
      render: (_, record) => {
        const timeZone = record.timeZone || 'America/New_York';
        return <FormattedMessage id={`pages.strategy.user.stockRelation.timeZone.${timeZone === 'America/New_York' ? 'newyork' : 'shanghai'}`} defaultMessage={timeZone === 'America/New_York' ? '美东时区' : '北京时区'} />;
      },
    },
    {
      title: (
        <>
          <>是否开盘买入</>
          <Tooltip title="是否在开盘时执行买入策略。优先级：用户设置 > 策略默认 > 系统默认(开启)">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'enableOpeningBuy',
      hideInSearch: true,
      render: (_, record) => {
        const getNextValue = (current: boolean | null | undefined): boolean | null => {
          console.log('getNextValue - 当前值:', current, '类型:', typeof current);
          if (current === true) {
            console.log('true -> false');
            return false;
          }
          if (current === false) {
            console.log('false -> null');
            return null;
          }
          console.log('null/undefined -> true');
          return true; // null -> true
        };
        
        const getDisplayText = (value: boolean | null | undefined): string => {
          if (value === true) return '开启';
          if (value === false) return '关闭';
          return '策略默认';
        };
        
        const getColor = (value: boolean | null | undefined): string => {
          if (value === true) return '#52c41a';
          if (value === false) return '#ff4d4f';
          return '#1890ff';
        };
        
        return (
          <Tag
            color={getColor(record.enableOpeningBuy)}
            style={{ cursor: 'pointer' }}
            onClick={async () => {
              const currentValue = record.enableOpeningBuy;
              const nextValue = getNextValue(currentValue);
              console.log('点击切换开盘买入:', {
                id: record.id,
                currentValue,
                nextValue,
                displayText: getDisplayText(nextValue)
              });
              
              try {
                await handleUpdateOpeningBuy(record.id!, nextValue);
              } catch (error) {
                console.error('更新开盘买入状态失败:', error);
              }
            }}
          >
            {getDisplayText(record.enableOpeningBuy)}
          </Tag>
        );
      },
    },
    {
      title: (
        <span>
          <>策略配置模版ID</>
          <Tooltip title="该配置来源于哪个配置模版">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'configTemplateId',
      hideInSearch: true,
      render: (text, record) => {
        if (record.configTemplateId === null || record.configTemplateId === undefined) {
          return '-';
        }
        return record.configTemplateId;
      },
    },
    {
      title: <FormattedMessage id="pages.strategy.createTime" defaultMessage="Create Time" />,
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '是否启动二阶段策略',
      dataIndex: 'secondStageEnabled',
      valueType: 'switch',
      hideInSearch: true,
      render: (_, record) => (
        <Switch
          checkedChildren="是"
          unCheckedChildren="否"
          checked={!!record.secondStageEnabled}
          onChange={async (checked) => {
            const params = {
              id: record.id!,
              enabled: checked,
            };
            console.log('二阶段开关点击', params);
            const hide = message.loading(checked ? '启动中...' : '禁用中...');
            try {
              await updateStrategyUserStockSecondStage(params);
              message.success(checked ? '已启动二阶段' : '已禁用二阶段');
            } catch (e) {
              message.error('操作失败: ' + (e && typeof e === 'object' && 'message' in e ? (e as any).message : String(e)));
            } finally {
              hide();
              actionRef.current?.reload();
            }
          }}
        />
      ),
    },
    {
      title: '启动二阶段策略日期',
      dataIndex: 'secondStageStartDate',
      hideInSearch: true,
      render: (text) => text || '-',
    },
    {
      title: <FormattedMessage id="pages.strategy.user.stockRelation.status" defaultMessage="Status" />,
      dataIndex: 'status',
      valueEnum: {
        '0': {
          text: <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
          status: 'Default',
        },
        '1': {
          text: <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
          status: 'Success',
        },
      },
      render: (_, record) => (
        <Switch
          checkedChildren={<FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />}
          unCheckedChildren={<FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />}
          checked={record.status === '1'}
          onChange={(checked) => {
            handleUpdateStatus(record.id!, checked ? '1' : '0');
          }}
        />
      ),
    },
    {
      title: <FormattedMessage id="pages.common.actions" defaultMessage="Actions" />,
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="edit"
          onClick={() => {
            // 转换数据，将小数转为百分比
            const editItem = {...record};
            if (editItem.fundPercent !== undefined) {
              editItem.fundPercent = editItem.fundPercent * 100;
            }
            setCurrentRow(editItem);
            setUpdateModalVisible(true);
          }}
        >
          <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
        </a>,
        <a
          key="saveAsTemplate"
          onClick={() => handleSaveAsTemplate(record)}
        >
          保存为模版
        </a>,
        <Popconfirm
          key="delete"
          title={<FormattedMessage id="pages.common.deleteConfirm" defaultMessage="Are you sure you want to delete this item?" />}
          onConfirm={() => handleDelete(record)}
          okText={<FormattedMessage id="pages.common.yes" defaultMessage="Yes" />}
          cancelText={<FormattedMessage id="pages.common.no" defaultMessage="No" />}
        >
          <a>
            <FormattedMessage id="pages.common.delete" defaultMessage="Delete" />
          </a>
        </Popconfirm>
      ],
    },
  ];
  
  // 根据当前选择的策略渲染过滤标签
  const renderFilterTag = () => {
    if (strategyId && strategyName) {
      return (
        <Space style={{ marginBottom: 16 }}>
          <span>
            <FormattedMessage id="pages.filtered.by.strategy" defaultMessage="Filtered by Strategy:" />
          </span>
          <Tag color="blue" closable onClose={onClearStrategy}>
            {strategyName} (ID: {strategyId})
          </Tag>
        </Space>
      );
    }
    return null;
  };
  
  return (
    <>
      {renderFilterTag()}
      
      {/* 统计卡片 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="记录数量" 
              value={summaryData.recordCount}
              valueStyle={{ color: '#1890ff' }}
              formatter={(value) => value?.toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="涉及账户" 
              value={summaryData.accountCount}
              valueStyle={{ color: '#722ed1' }}
              formatter={(value) => value?.toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="账户总资金" 
              value={summaryData.totalAccountAmount}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => value?.toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="单次资金总计" 
              value={summaryData.totalSingleAmount}
              precision={2}
              suffix={`(${summaryData.singleAmountRatio.toFixed(2)}%)`}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => value?.toLocaleString()}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="单天最大持有资金" 
              value={summaryData.totalDailyMaxHolding}
              precision={2}
              suffix={`(${summaryData.dailyMaxHoldingRatio.toFixed(2)}%)`}
              valueStyle={{ color: '#f5222d' }}
              formatter={(value) => value?.toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="最大持有资金" 
              value={summaryData.totalMaxHolding}
              precision={2}
              suffix={`(${summaryData.maxHoldingRatio.toFixed(2)}%)`}
              valueStyle={{ color: '#fa541c' }}
              formatter={(value) => value?.toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="资金最大使用股票" 
              value={summaryData.maxStockCode ? `${summaryData.maxStockCode}(${summaryData.maxStockRatio.toFixed(2)}%)` : '无'}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            {/* 空列，保持布局对称 */}
          </Col>
        </Row>
      </Card>
      
      <ProTable<API.StrategyUserStockItem, API.PageParams>
        actionRef={actionRef}
        formRef={searchFormRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            <PlusOutlined /> <FormattedMessage id="pages.common.new" defaultMessage="New" />
          </Button>,
          <Button
            key="batch-new"
            type="primary"
            onClick={() => setBatchCreateModalVisible(true)}
          >
            <PlusOutlined /> 批量新增
          </Button>,
          <Button
            key="apply-template"
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                message.warning('请先选择要应用配置的目标');
                return;
              }
              loadTemplates();
              setApplyTemplateModalVisible(true);
            }}
          >
            <ThunderboltOutlined /> 应用模版
          </Button>,
          <Dropdown.Button
            key="batch-opening-buy"
            overlay={
              <Menu
                items={[
                  {
                    key: '1',
                    label: '批量开启开盘买入',
                    onClick: () => handleBatchUpdateOpeningBuy(true),
                  },
                  {
                    key: '2',
                    label: '批量关闭开盘买入',
                    onClick: () => handleBatchUpdateOpeningBuy(false),
                  },
                  {
                    key: '3',
                    label: '批量设为策略默认',
                    onClick: () => handleBatchUpdateOpeningBuy(null),
                  },
                ]}
              />
            }
            disabled={selectedRowKeys.length === 0}
          >
            批量开盘买入
          </Dropdown.Button>,
          <Dropdown.Button
            key="batch-status"
            overlay={
              <Menu
                items={[
                  {
                    key: '1',
                    label: '批量启用',
                    onClick: () => handleBatchUpdateStatus('1'),
                  },
                  {
                    key: '2',
                    label: '批量禁用',
                    onClick: () => handleBatchUpdateStatus('0'),
                  },
                ]}
              />
            }
            disabled={selectedRowKeys.length === 0}
          >
            批量状态
          </Dropdown.Button>,
          <Dropdown.Button
            key="batch-config"
            overlay={
              <Menu
                items={[
                  {
                    key: '1',
                    label: '批量设置盈利比例',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('请先选择要更新的记录');
                        return;
                      }
                      
                      let profitRatio = 1.5;
                      Modal.confirm({
                        title: '批量设置盈利比例',
                        content: (
                          <div style={{ marginTop: 16 }}>
                            <span>盈利比例（%）：</span>
                            <InputNumber
                              defaultValue={1.5}
                              min={0.1}
                              max={100}
                              step={0.1}
                              precision={2}
                              style={{ width: 120, marginLeft: 8 }}
                              onChange={(value) => {
                                profitRatio = value || 1.5;
                              }}
                            />
                          </div>
                        ),
                        onOk: () => handleBatchUpdateProfitRatio(profitRatio),
                        okText: '确定',
                        cancelText: '取消',
                      });
                    },
                  },
                  {
                    key: '2',
                    label: '批量设置开始时间',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('请先选择要更新的记录');
                        return;
                      }
                      setBatchTimeType('start');
                      setBatchTimeModalVisible(true);
                    },
                  },
                  {
                    key: '3',
                    label: '批量设置结束时间',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('请先选择要更新的记录');
                        return;
                      }
                      setBatchTimeType('end');
                      setBatchTimeModalVisible(true);
                    },
                  },
                  {
                    key: '4',
                    label: '批量设置开始结束时间',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('请先选择要更新的记录');
                        return;
                      }
                      setBatchTimeType('both');
                      setBatchTimeModalVisible(true);
                    },
                  },
                  {
                    key: '5',
                    label: '批量设置未卖出堆栈值',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('请先选择要更新的记录');
                        return;
                      }
                      setBatchUnsoldStackModalVisible(true);
                    },
                  },
                  {
                    key: '6',
                    label: '批量设置限制开始份数',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('请先选择要更新的记录');
                        return;
                      }
                      setBatchLimitStartModalVisible(true);
                    },
                  },
                  {
                    key: '7',
                    label: '批量设置最大持有买入单数',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('请先选择要更新的记录');
                        return;
                      }
                      setBatchTotalFundModalVisible(true);
                    },
                  },
                ]}
              />
            }
            disabled={selectedRowKeys.length === 0}
          >
            批量配置
          </Dropdown.Button>,
        ]}
        request={(params, sort, filter) => {
          // 添加策略ID作为过滤条件（如果有）
          const queryParams = { ...params } as any;
          if (strategyId) {
            queryParams.strategyId = strategyId;
          }
          return listStrategyUserStock(queryParams).then(response => {
            if (response && response.data) {
              console.log('Strategy user stock data:', response.data);
              // 更新当前表格数据状态
              setCurrentTableData(response.data);
              return {
                data: response.data,
                success: true,
                total: response.total || response.data.length
              };
            }
            // 如果没有数据，清空当前表格数据
            setCurrentTableData([]);
            return {
              data: [],
              success: false,
              total: 0
            };
          });
        }}
        columns={columns}
      />
      
      {/* 新增策略用户股票关系表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.user.stockRelation.create" defaultMessage="Create Strategy User Stock Relation" />}
        width="650px"
        formRef={createFormRef}
        modalProps={{
          destroyOnClose: true,
          footer: null, // 隐藏默认底部按钮
        }}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleAdd}
        submitter={false} // 禁用默认提交按钮
      >
        {/* 顶部按钮区域 */}
        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <Button 
            onClick={() => setCreateModalVisible(false)}
            style={{ marginRight: '8px' }}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            onClick={() => {
              createFormRef.current?.submit();
            }}
          >
            确定
          </Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {!strategyId && (
            <div style={{ width: '100%' }}>
              <ProFormSelect
                name="strategyId"
                label={<FormattedMessage id="pages.strategy.job.id" defaultMessage="Strategy ID" />}
                rules={[{ required: true }]}
                request={async () => {
                  // 获取策略任务列表
                  const res = await listStrategyJob({
                    current: 1,
                    pageSize: 100,
                    status: '1', // 只获取启用状态的策略
                  });
                  if (res && res.data) {
                    return res.data.map((item: any) => ({
                      label: `${item.name} (ID: ${item.id})`,
                      value: item.id,
                      strategyName: item.name,
                    }));
                  }
                  return [];
                }}
                fieldProps={{
                  onChange: (value, option: any) => {
                    if (createFormRef.current && option?.strategyName) {
                      createFormRef.current.setFieldsValue({
                        strategyName: option.strategyName,
                      });
                    }
                  },
                }}
              />
            </div>
          )}
          
          {!strategyId && (
            <ProFormText
              name="strategyName"
              label={<FormattedMessage id="pages.strategy.job.name" defaultMessage="Strategy Name" />}
              rules={[{ required: true }]}
              hidden
            />
          )}
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="account"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.account" defaultMessage="Account" />}
              rules={[{ required: true }]}
              request={async () => {
                // 获取账户列表
                const res = await listAccount({});
                if (res && res.data) {
                  return res.data.map((item: any) => ({
                    label: `${item.account} (${item.name})`,
                    value: item.account,
                    accountName: item.name,
                  }));
                }
                return [];
              }}
              fieldProps={{
                onChange: (value, option: any) => {
                  if (createFormRef.current && option?.accountName) {
                    createFormRef.current.setFieldsValue({
                      accountName: option.accountName,
                    });
                  }
                },
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="stockCode"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.stockCode" defaultMessage="Stock Code" />}
              rules={[{ required: true }]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="accountName"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.accountName" defaultMessage="Account Name" />}
              hidden
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="fundPercent"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.fundPercent" defaultMessage="Fund Percent" />}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.fundPercentTip' })}
              min={0}
              max={100}
              fieldProps={{
                precision: 1,
                suffix: '%',
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="maxAmount"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.maxAmount" defaultMessage="Max Amount" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.maxAmount.placeholder', defaultMessage: '填入最大资金' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.maxAmountTip' })}
              min={0}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="dailyCompletedOrders"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.dailyCompletedOrders" defaultMessage="每日最大完成单数" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.dailyCompletedOrders.placeholder', defaultMessage: '留空表示不限制' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.dailyCompletedOrdersTip', defaultMessage: '每天最大完成单数限制，当当天已完成订单数量达到这个值时，将停止下单' })}
              min={0}
              fieldProps={{
                precision: 0,
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="unsoldStackLimit"
              label="未卖出堆栈值"
              tooltip="限制当天同一股票在同一策略下最多允许的未卖出买入订单数"
              min={1}
              max={20}
              initialValue={4}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="limitStartShares"
              label="限制开始份数"
              tooltip="从第几份开始限制买入，默认为9"
              min={1}
              max={100}
              initialValue={9}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="totalFundShares"
              label="最大持有买入单数"
              tooltip="最大持有买入单数"
              min={1}
              max={100}
              initialValue={18}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>
          
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="startTime"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.startTime" defaultMessage="开始时间" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.startTime.placeholder', defaultMessage: '格式为HH:mm，例如10:00' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.startTimeTip', defaultMessage: '策略开始执行时间（基于设置的时区）' })}
              rules={[
                { 
                  pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, 
                  message: intl.formatMessage({ id: 'pages.strategy.user.stockRelation.time.invalid', defaultMessage: '时间格式无效，应为HH:mm' }) 
                }
              ]}
              initialValue="10:00"
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="endTime"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.endTime" defaultMessage="结束时间" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.endTime.placeholder', defaultMessage: '格式为HH:mm，例如16:00' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.endTimeTip', defaultMessage: '策略结束执行时间（基于设置的时区）' })}
              rules={[
                { 
                  pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, 
                  message: intl.formatMessage({ id: 'pages.strategy.user.stockRelation.time.invalid', defaultMessage: '时间格式无效，应为HH:mm' }) 
                }
              ]}
              initialValue="16:00"
            />
          </div>   

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="timeZone"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.timeZone" defaultMessage="时区" />}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.timeZoneTip', defaultMessage: '策略执行的时区，默认为美东时区' })}
              valueEnum={{
                'America/New_York': intl.formatMessage({ id: 'pages.strategy.user.stockRelation.timeZone.newyork', defaultMessage: '美东时区' }),
                'Asia/Shanghai': intl.formatMessage({ id: 'pages.strategy.user.stockRelation.timeZone.shanghai', defaultMessage: '北京时区' }),
              }}
              initialValue="America/New_York"
            />
          </div>   

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="cooldownTime"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.cooldownTime" defaultMessage="买入冷却时间(分钟)" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.cooldownTime.placeholder', defaultMessage: '留空使用默认值30分钟' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.cooldownTimeTip', defaultMessage: '两次相邻买入之间的冷却时间，单位分钟，默认30分钟' })}
              min={1}
              initialValue={30}
              fieldProps={{
                precision: 0,
              }}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="profitRatio"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.profitRatio" defaultMessage="盈利比例" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.profitRatio.placeholder', defaultMessage: '留空使用策略默认值' })}
              tooltip={<FormattedMessage id="pages.strategy.user.stockRelation.profitRatioTip" defaultMessage="用户自定义的盈利比例，如果设置了该值，策略将优先使用此比例进行止盈" />}
              min={0}
              max={1000}
              initialValue={1}
              fieldProps={{
                precision: 2,
                addonAfter: '%',
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="enableOpeningBuy"
              label="是否开盘买入"
              tooltip="是否在开盘时执行买入策略，优先级高于策略标的设置，默认使用策略标的设置"
              valueEnum={{
                'true': '开启',
                'false': '关闭',
                'null': '使用策略默认',
              }}
              initialValue="null"
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="status"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.status" defaultMessage="Status" />}
              valueEnum={{
                '0': <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
                '1': <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
              }}
              initialValue="1"
              rules={[{ required: true }]}
            />
          </div>
        </div>
      </ModalForm>
      
      {/* 编辑策略用户股票关系表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.user.stockRelation.edit" defaultMessage="Edit Strategy User Stock Relation" />}
        width="650px"
        formRef={updateFormRef}
        modalProps={{
          destroyOnClose: true,
          footer: null, // 隐藏默认底部按钮
        }}
        open={updateModalVisible}
        onOpenChange={setUpdateModalVisible}
        onFinish={handleUpdate}
        submitter={false} // 禁用默认提交按钮
        initialValues={{
          ...currentRow,
          // 将数据库中的小数值转换为百分比显示
          fundPercent: currentRow?.fundPercent ? currentRow.fundPercent * 100 : undefined,
          profitRatio: currentRow?.profitRatio ? currentRow.profitRatio * 100 : undefined,
          // 将数据库中的enableOpeningBuy值转换为表单字符串值
          enableOpeningBuy: currentRow?.enableOpeningBuy === true ? 'true' : 
                           currentRow?.enableOpeningBuy === false ? 'false' : 'null',
        }}
      >
        {/* 顶部按钮区域 */}
        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <Button 
            onClick={() => setUpdateModalVisible(false)}
            style={{ marginRight: '8px' }}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            onClick={() => {
              updateFormRef.current?.submit();
            }}
          >
            确定
          </Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="account"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.account" defaultMessage="Account" />}
              rules={[{ required: true }]}
              disabled
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="stockCode"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.stockCode" defaultMessage="Stock Code" />}
              rules={[{ required: true }]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="accountName"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.accountName" defaultMessage="Account Name" />}
              disabled
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="fundPercent"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.fundPercent" defaultMessage="Fund Percent" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.fundPercent.placeholder' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.fundPercentTip' })}
              min={0}
              max={100}
              fieldProps={{
                precision: 1,
                suffix: '%',
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="maxAmount"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.maxAmount" defaultMessage="Max Amount" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.maxAmount.placeholder', defaultMessage: 'Leave empty to use Fund Percent' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.maxAmountTip' })}
              min={0}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="dailyCompletedOrders"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.dailyCompletedOrders" defaultMessage="每日最大完成单数" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.dailyCompletedOrders.placeholder', defaultMessage: '留空表示不限制' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.dailyCompletedOrdersTip', defaultMessage: '每天最大完成单数限制，当当天已完成订单数量达到这个值时，将停止下单' })}
              min={0}
              fieldProps={{
                precision: 0,
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="unsoldStackLimit"
              label="未卖出堆栈值"
              tooltip="限制当天同一股票在同一策略下最多允许的未卖出买入订单数"
              min={1}
              max={20}
              initialValue={4}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="limitStartShares"
              label="限制开始份数"
              tooltip="从第几份开始限制买入，默认为9"
              min={1}
              max={100}
              initialValue={9}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="totalFundShares"
              label="最大持有买入单数"
              tooltip="最大持有买入单数"
              min={1}
              max={100}
              initialValue={18}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="startTime"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.startTime" defaultMessage="开始时间" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.startTime.placeholder', defaultMessage: '格式为HH:mm，例如10:00' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.startTimeTip', defaultMessage: '策略开始执行时间（基于设置的时区）' })}
              rules={[
                { 
                  pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, 
                  message: intl.formatMessage({ id: 'pages.strategy.user.stockRelation.time.invalid', defaultMessage: '时间格式无效，应为HH:mm' }) 
                }
              ]}
              initialValue="10:00"
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="endTime"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.endTime" defaultMessage="结束时间" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.endTime.placeholder', defaultMessage: '格式为HH:mm，例如16:00' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.endTimeTip', defaultMessage: '策略结束执行时间（基于设置的时区）' })}
              rules={[
                { 
                  pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, 
                  message: intl.formatMessage({ id: 'pages.strategy.user.stockRelation.time.invalid', defaultMessage: '时间格式无效，应为HH:mm' }) 
                }
              ]}
              initialValue="16:00"
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="timeZone"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.timeZone" defaultMessage="时区" />}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.timeZoneTip', defaultMessage: '策略执行的时区，默认为美东时区' })}
              valueEnum={{
                'America/New_York': intl.formatMessage({ id: 'pages.strategy.user.stockRelation.timeZone.newyork', defaultMessage: '美东时区' }),
                'Asia/Shanghai': intl.formatMessage({ id: 'pages.strategy.user.stockRelation.timeZone.shanghai', defaultMessage: '北京时区' }),
              }}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="cooldownTime"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.cooldownTime" defaultMessage="买入冷却时间(分钟)" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.cooldownTime.placeholder', defaultMessage: '留空使用默认值30分钟' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.cooldownTimeTip', defaultMessage: '两次相邻买入之间的冷却时间，单位分钟，默认30分钟' })}
              min={1}
              initialValue={30}
              fieldProps={{
                precision: 0,
              }}
            />
          </div>

                    
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="profitRatio"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.profitRatio" defaultMessage="盈利比例" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.profitRatio.placeholder', defaultMessage: '留空使用策略默认值' })}
              tooltip={<FormattedMessage id="pages.strategy.user.stockRelation.profitRatioTip" defaultMessage="用户自定义的盈利比例，如果设置了该值，策略将优先使用此比例进行止盈" />}
              min={0}
              max={100}
              fieldProps={{
                precision: 2,
                addonAfter: '%',
              }}
            />
          </div>
        
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="enableOpeningBuy"
              label="是否开盘买入"
              tooltip="是否在开盘时执行买入策略，优先级高于策略标的设置，默认使用策略标的设置"
              valueEnum={{
                'true': '开启',
                'false': '关闭',
                'null': '使用策略默认',
              }}
              initialValue="null"
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="status"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.status" defaultMessage="Status" />}
              valueEnum={{
                '0': <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
                '1': <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
              }}
              rules={[{ required: true }]}
            />
          </div>
        </div>
      </ModalForm>
      
      {/* 保存配置模版Modal */}
      <ModalForm
        title="保存配置模版"
        width="500px"
        formRef={saveTemplateFormRef}
        modalProps={{
          destroyOnClose: true,
          footer: null, // 隐藏默认底部按钮
        }}
        open={saveTemplateModalVisible}
        onOpenChange={(visible) => {
          setSaveTemplateModalVisible(visible);
          if (!visible) {
            // 关闭时清理状态
            setTemplateInitialValues({});
            setSelectedRowKeys([]);
          }
        }}
        onFinish={handleSaveTemplate}
        initialValues={templateInitialValues}
        submitter={false} // 禁用默认提交按钮
      >
        {/* 顶部按钮区域 */}
        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <Button 
            onClick={() => setSaveTemplateModalVisible(false)}
            style={{ marginRight: '8px' }}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            onClick={() => {
              saveTemplateFormRef.current?.submit();
            }}
          >
            确定
          </Button>
        </div>
        <ProFormText
          name="name"
          label="模版名称"
          rules={[{ required: true, message: '请输入模版名称' }]}
          placeholder="请输入模版名称"
        />
        <ProFormTextArea
          name="applicableScenario"
          label="适用场景"
          placeholder="请输入适用场景（可选）"
          fieldProps={{
            rows: 3,
          }}
        />
        <ProFormSelect
          name="marketCondition"
          label="行情类型"
          placeholder="请选择行情类型（可选）"
          valueEnum={{
            '震荡': '震荡',
            '高开高走': '高开高走',
            '高开低走': '高开低走',
            '低开高走': '低开高走',
            '低开低走': '低开低走',
          }}
        />
        <ProFormText
          name="volatilityRange"
          label="波动范围"
          placeholder="请输入波动范围（可选）"
        />
        <ProFormSelect
          name="strategyId"
          label="策略"
          request={async () => {
            // 获取策略列表
            const res = await listStrategyJob({
              current: 1,
              pageSize: 100,
              status: '1',
            });
            if (res && res.data) {
              return res.data.map((item: any) => ({
                label: item.name,
                value: item.id,
              }));
            }
            return [];
          }}
          placeholder="请选择策略（可选）"
        />
        <ProFormText
          name="sourceStockCode"
          label="来源股票代码"
          placeholder="请输入来源股票代码（可选）"
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <ProFormDigit
              name="minMarketCap"
              label="最小市值（亿美元）"
              placeholder="请输入最小市值"
              min={0}
              fieldProps={{
                precision: 2,
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <ProFormDigit
              name="maxMarketCap"
              label="最大市值（亿美元）"
              placeholder="请输入最大市值"
              min={0}
              fieldProps={{
                precision: 2,
              }}
            />
          </div>
        </div>
      </ModalForm>

      {/* 应用配置模版Modal */}
      <Modal
        title="应用配置模版"
        open={applyTemplateModalVisible}
        onCancel={() => {
          setApplyTemplateModalVisible(false);
          setSelectedTemplate(undefined);
        }}
        onOk={handleApplyTemplate}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <h4>选择要应用的模版：</h4>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择模版"
            value={selectedTemplate}
            onChange={setSelectedTemplate}
          >
            {templates.map(template => (
              <Select.Option key={template.id} value={template.id}>
                <div>
                  <strong>{template.name}</strong>
                  {template.applicableScenario && <div style={{ fontSize: '12px', color: '#666' }}>{template.applicableScenario}</div>}
                  {template.marketCondition && <div style={{ fontSize: '12px', color: '#1890ff' }}>行情: {template.marketCondition}</div>}
                  {template.volatilityRange && <div style={{ fontSize: '12px', color: '#52c41a' }}>波动范围: {template.volatilityRange}</div>}
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    创建时间: {template.createTime}
                  </div>
                </div>
              </Select.Option>
            ))}
          </Select>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <h4>模版管理：</h4>
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {templates.map(template => (
              <div key={template.id} style={{ 
                padding: 8, 
                border: '1px solid #d9d9d9', 
                borderRadius: 4, 
                marginBottom: 8,
                backgroundColor: selectedTemplate === template.id ? '#e6f7ff' : '#fff'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong>{template.name}</strong>
                    {template.applicableScenario && <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>{template.applicableScenario}</div>}
                    {template.marketCondition && <div style={{ fontSize: '12px', color: '#1890ff', marginTop: 2 }}>行情: {template.marketCondition}</div>}
                    {template.volatilityRange && <div style={{ fontSize: '12px', color: '#52c41a', marginTop: 2 }}>波动范围: {template.volatilityRange}</div>}
                    {template.strategyId && <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>策略ID: {template.strategyId}</div>}
                    {template.sourceStockCode && <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>来源股票: {template.sourceStockCode}</div>}
                    {(template.minMarketCap || template.maxMarketCap) && (
                      <div style={{ fontSize: '11px', color: '#999', marginTop: 2 }}>
                        市值范围: {template.minMarketCap || 0} - {template.maxMarketCap || '∞'} 亿美元
                      </div>
                    )}
                    <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
                      创建时间: {template.createTime}
                    </div>
                  </div>
                  <Button
                    type="link"
                    danger
                    size="small"
                    onClick={() => {
                      Modal.confirm({
                        title: '确认删除',
                        content: `确定要删除模版"${template.name}"吗？`,
                        onOk: () => handleDeleteTemplate(template.id!),
                      });
                    }}
                  >
                    删除
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div style={{ color: '#666', fontSize: '12px' }}>
          将应用到 {selectedRowKeys.length} 个选中的配置
        </div>
      </Modal>

      {/* 批量时间设置Modal */}
      <Modal
        title={
          batchTimeType === 'start' ? '批量设置开始时间' :
          batchTimeType === 'end' ? '批量设置结束时间' :
          '批量设置开始结束时间'
        }
        open={batchTimeModalVisible}
        onCancel={() => setBatchTimeModalVisible(false)}
        onOk={handleBatchTimeConfirm}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginTop: 16 }}>
          {(batchTimeType === 'start' || batchTimeType === 'both') && (
            <div style={{ marginBottom: batchTimeType === 'both' ? 12 : 0 }}>
              <span>开始时间：</span>
              <Input
                value={batchStartTime}
                style={{ width: 120, marginLeft: 8 }}
                placeholder="HH:mm"
                onChange={(e) => setBatchStartTime(e.target.value)}
              />
            </div>
          )}
          {(batchTimeType === 'end' || batchTimeType === 'both') && (
            <div>
              <span>结束时间：</span>
              <Input
                value={batchEndTime}
                style={{ width: 120, marginLeft: 8 }}
                placeholder="HH:mm"
                onChange={(e) => setBatchEndTime(e.target.value)}
              />
            </div>
          )}
        </div>
        <div style={{ color: '#666', fontSize: '12px', marginTop: 16 }}>
          将更新 {selectedRowKeys.length} 个选中的记录
        </div>
      </Modal>

      {/* 批量设置未卖出堆栈值Modal */}
      <Modal
        title="批量设置未卖出堆栈值"
        open={batchUnsoldStackModalVisible}
        onCancel={() => setBatchUnsoldStackModalVisible(false)}
        onOk={() => {
          handleBatchUpdateUnsoldStackLimit();
          setBatchUnsoldStackModalVisible(false);
        }}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginTop: 16 }}>
          <span>未卖出堆栈值：</span>
          <InputNumber
            value={batchUnsoldStackLimit}
            min={1}
            step={1}
            style={{ width: 120, marginLeft: 8 }}
            onChange={(value) => setBatchUnsoldStackLimit(value || 5)}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
            限制当天同一股票在同一策略下最多允许的未卖出买入订单数（必须为正数）
          </div>
        </div>
        <div style={{ color: '#666', fontSize: '12px', marginTop: 16 }}>
          将更新 {selectedRowKeys.length} 个选中的记录
        </div>
      </Modal>

      {/* 批量设置限制开始份数Modal */}
      <Modal
        title="批量设置限制开始份数"
        open={batchLimitStartModalVisible}
        onCancel={() => setBatchLimitStartModalVisible(false)}
        onOk={() => {
          handleBatchUpdateLimitStartShares();
          setBatchLimitStartModalVisible(false);
        }}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginTop: 16 }}>
          <span>限制开始份数：</span>
          <InputNumber
            value={batchLimitStartShares}
            min={1}
            step={1}
            style={{ width: 120, marginLeft: 8 }}
            onChange={(value) => setBatchLimitStartShares(value || 9)}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
            从第几份开始限制买入，默认为9（必须为正数）
          </div>
        </div>
        <div style={{ color: '#666', fontSize: '12px', marginTop: 16 }}>
          将更新 {selectedRowKeys.length} 个选中的记录
        </div>
      </Modal>

      {/* 批量设置最大持有买入单数Modal */}
      <Modal
        title="批量设置最大持有买入单数"
        open={batchTotalFundModalVisible}
        onCancel={() => setBatchTotalFundModalVisible(false)}
        onOk={() => {
          handleBatchUpdateTotalFundShares();
          setBatchTotalFundModalVisible(false);
        }}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginTop: 16 }}>
          <span>最大持有买入单数：</span>
          <InputNumber
            value={batchTotalFundShares}
            min={1}
            step={1}
            style={{ width: 120, marginLeft: 8 }}
            onChange={(value) => setBatchTotalFundShares(value || 18)}
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: 8 }}>
            资金分成多少份用于买入，默认18份（必须为正数）
          </div>
        </div>
        <div style={{ color: '#666', fontSize: '12px', marginTop: 16 }}>
          将更新 {selectedRowKeys.length} 个选中的记录
        </div>
      </Modal>
      
      {/* 批量创建策略用户股票关系表单 */}
      <ModalForm
        title="批量创建策略用户股票关系"
        width="750px"
        formRef={batchCreateFormRef}
        modalProps={{
          destroyOnClose: true,
          footer: null, // 隐藏默认底部按钮
        }}
        open={batchCreateModalVisible}
        onOpenChange={(open) => {
          setBatchCreateModalVisible(open);
          if (!open) {
            // 表单关闭时清理状态
            setSelectedAccountsInfo([]);
            setSelectedAccountsStocks([]);
          }
        }}
        onFinish={handleBatchCreate}
        submitter={false} // 禁用默认提交按钮
        initialValues={{
          status: '1',
          startTime: '10:00',
          endTime: '16:00',
          timeZone: 'America/New_York',
          cooldownTime: 30,
          unsoldStackLimit: 4,
          limitStartShares: 9,
          totalFundShares: 18,
          fundPercent: 5,
          profitRatio: 1.5,
          enableOpeningBuy: 'null',
        }}
      >
        {/* 顶部按钮区域 */}
        <div style={{ marginBottom: '16px', textAlign: 'right' }}>
          <Button 
            onClick={() => setBatchCreateModalVisible(false)}
            style={{ marginRight: '8px' }}
          >
            取消
          </Button>
          <Button 
            type="primary" 
            onClick={() => {
              batchCreateFormRef.current?.submit();
            }}
          >
            确定
          </Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {!strategyId && (
            <div style={{ width: '100%' }}>
              <ProFormSelect
                name="strategyId"
                label="策略"
                rules={[{ required: true, message: '请选择策略' }]}
                request={async () => {
                  // 获取策略任务列表
                  const res = await listStrategyJob({
                    current: 1,
                    pageSize: 100,
                    status: '1', // 只获取启用状态的策略
                  });
                  if (res && res.data) {
                    return res.data.map((item: any) => ({
                      label: `${item.name} (ID: ${item.id})`,
                      value: item.id,
                      strategyName: item.name,
                    }));
                  }
                  return [];
                }}
                fieldProps={{
                  onChange: (value, option: any) => {
                    if (batchCreateFormRef.current && option?.strategyName) {
                      batchCreateFormRef.current.setFieldsValue({
                        strategyName: option.strategyName,
                      });
                    }
                  },
                }}
                placeholder="请选择策略"
              />
            </div>
          )}
          
          {!strategyId && (
            <ProFormText
              name="strategyName"
              label="策略名称"
              rules={[{ required: true }]}
              hidden
            />
          )}
          
          <div style={{ width: 'calc(50% - 4px)' }}>
            <ProFormSelect
              name="accounts"
              label="用户账号"
              mode="multiple"
              rules={[{ required: true, message: '请选择用户账号' }]}
              request={async () => {
                return accountOptions;
              }}
              fieldProps={{
                onChange: (value: string[]) => {
                  handleAccountsChange(value || []);
                },
              }}
              placeholder="请选择用户账号"
            />
          </div>
          
          {/* 显示选中账户的信息 */}
          {selectedAccountsInfo.length > 0 && (
            <div style={{ width: '100%', marginBottom: '16px' }}>
              <h4>选中账户信息：</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedAccountsInfo.map((account) => (
                  <div key={account.account} style={{ 
                    padding: '8px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '4px',
                    backgroundColor: '#fafafa',
                    minWidth: '200px'
                  }}>
                    <div><strong>{account.account}</strong> ({account.name})</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      总资金: ${account.totalAmount?.toFixed(2) || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      可用资金: ${account.availableAmount?.toFixed(2) || 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      证券市值: ${account.marketVal?.toFixed(2) || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* 显示选中账户已有的股票配置 */}
          {selectedAccountsStocks.length > 0 && (
            <div style={{ width: '100%', marginBottom: '16px' }}>
              <h4>已有股票配置 ({selectedAccountsStocks.length} 个)：</h4>
              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedAccountsStocks.map((stock, index) => (
                    <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
                      {stock.account}: {stock.stockCode} ({stock.strategyName})
                    </Tag>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#ff4d4f', marginTop: '8px' }}>
                ⚠️ 请注意避免重复创建已存在的股票配置
              </div>
            </div>
          )}
          
          <div style={{ width: 'calc(50% - 4px)' }}>
            <ProFormList
              name="stockCodes"
              label="股票代码"
              min={1}
              copyIconProps={false}
              creatorButtonProps={{
                position: 'bottom',
                creatorButtonText: '添加股票代码',
              }}
              initialValue={[{ code: '' }]}
            >
              <ProFormText
                name="code"
                placeholder="请输入股票代码，如：AAPL"
                rules={[
                  { required: true, message: '请输入股票代码' },
                  { 
                    pattern: /^[A-Z]{1,5}$/, 
                    message: '股票代码格式不正确，应为1-5位大写字母' 
                  }
                ]}
                fieldProps={{
                  style: { width: '100%' },
                  onChange: (e) => {
                    // 自动转换为大写
                    const value = e.target.value.toUpperCase();
                    e.target.value = value;
                  }
                }}
              />
            </ProFormList>
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="fundPercent"
              label="资金百分比"
              placeholder="留空则使用最大金额"
              tooltip="使用账户资金的百分比，与最大金额二选一"
              min={0}
              max={100}
              fieldProps={{
                precision: 1,
                addonAfter: '%',
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="maxAmount"
              label="最大金额"
              placeholder="留空则使用资金百分比"
              tooltip="固定的最大投资金额，与资金百分比二选一"
              min={0}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="dailyCompletedOrders"
              label="每日最大完成单数"
              placeholder="留空表示不限制"
              tooltip="每天最大完成单数限制，当当天已完成订单数量达到这个值时，将停止下单"
              min={0}
              fieldProps={{
                precision: 0,
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="startTime"
              label="开始时间"
              placeholder="格式为HH:mm，例如10:00"
              tooltip="策略开始执行时间（基于设置的时区）"
              rules={[
                { 
                  pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, 
                  message: '时间格式无效，应为HH:mm' 
                }
              ]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormText
              name="endTime"
              label="结束时间"
              placeholder="格式为HH:mm，例如16:00"
              tooltip="策略结束执行时间（基于设置的时区）"
              rules={[
                { 
                  pattern: /^([01]\d|2[0-3]):([0-5]\d)$/, 
                  message: '时间格式无效，应为HH:mm' 
                }
              ]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="timeZone"
              label="时区"
              tooltip="策略执行的时区，默认为美东时区"
              valueEnum={{
                'America/New_York': '美东时区',
                'Asia/Shanghai': '北京时区',
              }}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="cooldownTime"
              label="买入冷却时间(分钟)"
              placeholder="留空使用默认值30分钟"
              tooltip="两次相邻买入之间的冷却时间，单位分钟，默认30分钟"
              min={1}
              fieldProps={{
                precision: 0,
              }}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="unsoldStackLimit"
              label="未卖出堆栈值"
              tooltip="限制当天同一股票在同一策略下最多允许的未卖出买入订单数"
              min={1}
              max={20}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="limitStartShares"
              label="限制开始份数"
              tooltip="从第几份开始限制买入，默认为9"
              min={1}
              max={100}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>

          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="totalFundShares"
              label="最大持有买入单数"
              tooltip="最大持有买入单数"
              min={1}
              max={100}
              fieldProps={{
                precision: 0,
              }}
              rules={[{ required: true }]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="profitRatio"
              label="盈利比例"
              placeholder="留空使用策略默认值"
              tooltip="用户自定义的盈利比例，如果设置了该值，策略将优先使用此比例进行止盈"
              min={0}
              max={1000}
              fieldProps={{
                precision: 2,
                addonAfter: '%',
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="enableOpeningBuy"
              label="是否开盘买入"
              tooltip="是否在开盘时执行买入策略，优先级高于策略标的设置，默认使用策略标的设置"
              valueEnum={{
                'true': '开启',
                'false': '关闭',
                'null': '使用策略默认',
              }}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormSelect
              name="status"
              label="状态"
              valueEnum={{
                '0': '禁用',
                '1': '启用',
              }}
              rules={[{ required: true }]}
            />
          </div>
        </div>
      </ModalForm>
    </>
  );
});

export default StrategyUserStockList; 