import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState, useMemo } from 'react';
import { Button, message, Popconfirm, Space, Tag, Tooltip, Switch, Select, DatePicker, Modal, Checkbox, Dropdown, Menu, InputNumber, Input, Card, Statistic, Row, Col, Form, Typography, Divider, Badge, Radio } from 'antd';
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
  FormInstance,
  ProFormGroup,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, request } from '@umijs/max';
import { PlusOutlined, InfoCircleOutlined, FilterOutlined, CloseCircleOutlined, QuestionCircleOutlined, SaveOutlined, ThunderboltOutlined, DownOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined, MinusCircleOutlined } from '@ant-design/icons';
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
  updateStrategyUserStockTimeSegmentConfig,
  batchUpdateStrategyUserStockTimeSegmentConfig,
  saveConfigTemplate,
  applyConfigTemplate,
  getConfigTemplateList,
  deleteConfigTemplate,
  listStrategyStock,
  listAccountInfo,
  createTimeSegmentTemplate,
  updateTimeSegmentTemplate,
  deleteTimeSegmentTemplate,
  getTimeSegmentTemplateById,
  listTimeSegmentTemplates,
  getTimeSegmentTemplateLevels,
  listTimeSegmentTemplatesByLevel,
  applyTimeSegmentTemplateToUserStock,
} from '@/services/ant-design-pro/api';

// 收盘前盈利卖出枚举值映射
const PROFIT_SELL_BEFORE_CLOSE_ENUM = {
  PROFIT_SELL_BEFORE_CLOSE: '收盘前总盈利卖出',
  ALL_SELL_BEFORE_CLOSE: '收盘前全部卖出',
  NO_SELL: '不卖出',
};

interface StrategyUserStockListProps {
  strategyId?: number;
  strategyName?: string;
  onClearStrategy?: () => void;
  onStockClick?: (strategyId: number, stockCode: string) => void;
  preFillData?: {
    strategyId: number;
    strategyName: string;
    stockCode: string;
    accountInfo: any;
  };
  onPreFillDataUsed?: () => void;
}

/**
 * 策略用户股票关系列表组件
 */
const StrategyUserStockList = forwardRef((props: StrategyUserStockListProps, ref) => {
  const { strategyId, strategyName, onClearStrategy, onStockClick, preFillData, onPreFillDataUsed } = props;
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
  
  // 创建表单实例
  const [createForm] = Form.useForm();
  const [batchCreateForm] = Form.useForm();
  const [updateForm] = Form.useForm();
  
  // 时段配置相关状态
  const [timeSegmentModalVisible, setTimeSegmentModalVisible] = useState<boolean>(false);
  const [timeSegmentCurrentRecord, setTimeSegmentCurrentRecord] = useState<API.StrategyUserStockItem | null>(null);
  const [timeSegmentForm] = Form.useForm();
  
  // 档位配置相关状态
  const [saveTimeSegmentTemplateModalVisible, setSaveTimeSegmentTemplateModalVisible] = useState<boolean>(false);
  const [timeSegmentTemplateInitialValues, setTimeSegmentTemplateInitialValues] = useState<any>({});
  const saveTimeSegmentTemplateFormRef = useRef<FormInstance>();
  const [templateLevels, setTemplateLevels] = useState<{value: string, label: string}[]>([]);
  const [selectedTemplateLevel, setSelectedTemplateLevel] = useState<string>('');
  const [templatesByLevel, setTemplatesByLevel] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  
  // 添加应用档位对话框相关状态
  const [applyTimeSegmentTemplateModalVisible, setApplyTimeSegmentTemplateModalVisible] = useState<boolean>(false);
  const [timeSegmentTemplates, setTimeSegmentTemplates] = useState<any[]>([]);
  const [selectedTimeSegmentTemplate, setSelectedTimeSegmentTemplate] = useState<number>();
  const [timeSegmentTemplateForm] = Form.useForm();
  const timeSegmentTemplateFormRef = useRef<any>();
  const [timeSegmentTemplateSearchForm] = Form.useForm();
  const [timeSegmentTemplateSearchParams, setTimeSegmentTemplateSearchParams] = useState<any>({
    stockCode: '',
    templateLevel: '',
    account: '',
  });
  
  // 档位等级映射状态
  const [timeSegmentTemplateLevelMap, setTimeSegmentTemplateLevelMap] = useState<Map<number, string>>(new Map());
  
  // 默认时段分时平均线配置
  const defaultTimeSegmentMaConfig: Array<{
    timeSegment: string;
    maBelowPercent: number;
    maAbovePercent: number;
    profitPercent: number;
  }> = [];
  
  // 公开刷新方法
  useImperativeHandle(ref, () => ({
    reload: () => {
      actionRef.current?.reload();
    },
    openCreateModal: (preFillData?: any) => {
      console.log('openCreateModal被调用，预填数据:', preFillData);
      setCreateModalVisible(true);
      
      // 延迟设置预填数据，确保表单已经渲染
      setTimeout(() => {
        console.log('尝试设置表单数据，createForm:', createForm);
        if (preFillData) {
          const initialValues: any = {
            strategyId: preFillData.strategyId,
            strategyName: preFillData.strategyName,
            stockCode: preFillData.stockCode,
          };
          
          // 如果有账户信息，则预填账户
          if (preFillData.accountInfo) {
            initialValues.account = preFillData.accountInfo.account;
            initialValues.accountName = preFillData.accountInfo.accountName;
          }
          
          console.log('设置表单初始值:', initialValues);
          createForm.setFieldsValue(initialValues);
          
          // 强制更新表单显示
          createForm.validateFields();
        }
      }, 200); // 增加延迟时间
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

  // 解析时段分时平均线配置
  const parseTimeSegmentMaConfig = (configString: string | undefined) => {
    if (!configString) {
      return defaultTimeSegmentMaConfig;
    }
    try {
      const config = JSON.parse(configString);
      if (Array.isArray(config) && config.length > 0) {
        return config.map((item: any) => ({
          timeSegment: item.timeSegment || '09:30',
          maBelowPercent: item.maBelowPercent || 0.002,
          maAbovePercent: item.maAbovePercent || 0.001,
          profitPercent: item.profitPercent || 0.01,
        }));
      }
      return defaultTimeSegmentMaConfig;
    } catch (error) {
      console.warn('解析时段分时平均线配置失败:', error);
      return defaultTimeSegmentMaConfig;
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
        // 获取策略选项
        const strategyResponse = await listStrategyJob({
          current: 1,
          pageSize: 1000,
        });
        
        if (strategyResponse.success && strategyResponse.data) {
          const options = strategyResponse.data.map((job: API.StrategyJobItem) => ({
            label: job.name || `策略${job.id}`,
            value: job.id!,
          }));
          setStrategyOptions(options);
        }
        
        // 获取账户选项
        const accountResponse = await listAccount();
        if (accountResponse.success && accountResponse.data) {
          const options = accountResponse.data.map((account: any) => ({
            label: account.name || account.account,
            value: account.account,
          }));
          setAccountOptions(options);
        }
      } catch (error) {
        console.error('获取选项失败:', error);
      }
    };

    const fetchStrategyStockData = async () => {
      try {
        if (!strategyId) return;
        
        const response = await listStrategyStock({
          current: 1,
          pageSize: 1000,
          strategyId: strategyId,
        });
        
        if (response.success && response.data) {
          const stockMap = new Map<string, API.StrategyStockItem>();
          response.data.forEach((stock: API.StrategyStockItem) => {
            if (stock.stockCode) {
              stockMap.set(stock.stockCode, stock);
            }
          });
          setStrategyStockMap(stockMap);
        }
      } catch (error) {
        console.error('获取策略股票数据失败:', error);
      }
    };

    fetchOptions();
    fetchStrategyStockData();
    loadTemplates();
    loadTemplateLevels();
    loadTimeSegmentTemplateLevelMap();
    
    // 处理预填数据
    if (preFillData) {
      console.log('检测到预填数据:', preFillData);
      // 延迟一点时间确保组件完全加载
      setTimeout(() => {
        // 触发创建模态框
        setCreateModalVisible(true);
      }, 500);
    }
  }, [strategyId, preFillData]);

  // 处理预填数据
  useEffect(() => {
    if (preFillData) {
      // 自动打开新增弹窗并预填数据
      setCreateModalVisible(true);
      
      // 延迟设置预填数据，确保表单已经渲染
      setTimeout(() => {
        const initialValues: any = {
          strategyId: preFillData.strategyId,
          strategyName: preFillData.strategyName,
          stockCode: preFillData.stockCode,
        };
        
        // 如果有账户信息，则预填账户
        if (preFillData.accountInfo) {
          initialValues.account = preFillData.accountInfo.account;
          initialValues.accountName = preFillData.accountInfo.accountName;
        }
        
        createForm.setFieldsValue(initialValues);
      }, 100);
      
      // 通知父组件预填数据已使用
      if (onPreFillDataUsed) {
        onPreFillDataUsed();
      }
    }
  }, [preFillData, onPreFillDataUsed, createForm]);

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

  // 监听currentRow变化，动态设置编辑表单值
  useEffect(() => {
    if (currentRow && updateModalVisible) {
      const formValues = {
        ...currentRow,
        // 将数据库中的小数值转换为百分比显示
        fundPercent: currentRow?.fundPercent ? currentRow.fundPercent * 100 : undefined,
        profitRatio: currentRow?.profitRatio ? currentRow.profitRatio * 100 : undefined,
        // 将数据库中的enableOpeningBuy值转换为表单字符串值
        enableOpeningBuy: currentRow?.enableOpeningBuy === 1 ? '1' : 
                         currentRow?.enableOpeningBuy === 0 ? '0' : 
                         currentRow?.enableOpeningBuy === -1 ? '-1' : '-1',
        // 解析时段配置
        timeSegments: currentRow ? (() => {
          const config = parseTimeSegmentMaConfig((currentRow as any).timeSegmentMaConfig);
          return config.map(item => ({
            timeSegment: item.timeSegment,
            maBelowPercent: item.maBelowPercent * 100,
            maAbovePercent: item.maAbovePercent * 100,
            profitPercent: item.profitPercent * 100,
          }));
        })() : [],
      };
      
      console.log('设置编辑表单值:', JSON.stringify(formValues, null, 2));
      updateForm.setFieldsValue(formValues);
    }
  }, [currentRow, updateModalVisible]);

  // 添加策略用户股票关系
  const handleAdd = async (fields: any) => {
    console.log('handleAdd被调用，提交的完整字段:', JSON.stringify(fields, null, 2));
    console.log('账户别名字段:', fields.accountName);
    
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
    if (fields.enableOpeningBuy === '1') {
      fields.enableOpeningBuy = 1;
    } else if (fields.enableOpeningBuy === '0') {
      fields.enableOpeningBuy = 0;
    } else if (fields.enableOpeningBuy === '-1') {
      fields.enableOpeningBuy = -1;
    } else {
      fields.enableOpeningBuy = -1; // 默认使用策略默认
    }
    
    // 根据设置的字段设置相应的null值
    if (fields.maxAmount && fields.maxAmount > 0) {
      // 如果设置了最大金额，将资金百分比设为undefined
      fields.fundPercent = undefined;
    } else if (fields.fundPercent && fields.fundPercent > 0) {
      // 如果设置了资金百分比，将最大金额设为undefined
      fields.maxAmount = undefined;
    }
    
    // 处理时段配置
    if (fields.timeSegments && fields.timeSegments.length > 0) {
      // 验证时间段格式
      for (const segment of fields.timeSegments) {
        if (!validateTimeSegment(segment.timeSegment)) {
          message.error(`时间段格式错误：${segment.timeSegment}，请使用HH:mm格式`);
          hide();
          return false;
        }
      }
      
      // 检查时间段是否重复
      const timeSet = new Set();
      const duplicates: string[] = [];
      
      for (const segment of fields.timeSegments) {
        if (timeSet.has(segment.timeSegment)) {
          duplicates.push(segment.timeSegment);
        } else {
          timeSet.add(segment.timeSegment);
        }
      }
      
      if (duplicates.length > 0) {
        message.error(`时间段重复：${duplicates.join(', ')}`);
        hide();
        return false;
      }
      
      // 按时间顺序排序
      fields.timeSegments.sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment));
      
      // 转换数据格式（百分比转小数）
      const configData = fields.timeSegments.map((segment: any) => ({
        timeSegment: segment.timeSegment,
        maBelowPercent: segment.maBelowPercent / 100,
        maAbovePercent: segment.maAbovePercent / 100,
        profitPercent: segment.profitPercent / 100,
      }));
      
      fields.timeSegmentMaConfig = JSON.stringify(configData);
    }
    
    // 从表单数据中移除timeSegments字段，因为后端不需要这个字段
    delete fields.timeSegments;
    
    console.log('处理后的提交数据:', JSON.stringify(fields, null, 2));
    
    try {
      await createStrategyUserStock(fields);
      hide();
      message.success(intl.formatMessage({ id: 'pages.message.success' }));
      
      // 刷新表格
      if (actionRef.current) {
        actionRef.current.reload();
      }
      
      return true;
    } catch (error) {
      hide();
      console.error('创建策略用户股票关系失败:', error);
      message.error(intl.formatMessage({ id: 'pages.message.error' }));
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
      if (fields.enableOpeningBuy === '1') {
        fields.enableOpeningBuy = 1;
      } else if (fields.enableOpeningBuy === '0') {
        fields.enableOpeningBuy = 0;
      } else if (fields.enableOpeningBuy === '-1') {
        fields.enableOpeningBuy = -1;
      } else {
        fields.enableOpeningBuy = -1; // 默认使用策略默认
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
    if (fields.enableOpeningBuy === '1') {
      fields.enableOpeningBuy = 1;
    } else if (fields.enableOpeningBuy === '0') {
      fields.enableOpeningBuy = 0;
    } else if (fields.enableOpeningBuy === '-1') {
      fields.enableOpeningBuy = -1;
    } else {
      fields.enableOpeningBuy = -1; // 默认使用策略默认
    }
    
    // 根据设置的字段设置相应的null值
    if (fields.maxAmount && fields.maxAmount > 0) {
      // 如果设置了最大金额，将资金百分比设为undefined
      fields.fundPercent = undefined;
    } else if (fields.fundPercent && fields.fundPercent > 0) {
      // 如果设置了资金百分比，将最大金额设为undefined
      fields.maxAmount = undefined;
    }
    
    // 处理时段配置
    if (fields.timeSegments && fields.timeSegments.length > 0) {
      // 验证时间段格式
      for (const segment of fields.timeSegments) {
        if (!validateTimeSegment(segment.timeSegment)) {
          message.error(`时间段格式错误：${segment.timeSegment}，请使用HH:mm格式`);
          hide();
          return false;
        }
      }
      
      // 检查时间段是否重复
      const timeSet = new Set();
      const duplicates: string[] = [];
      
      for (const segment of fields.timeSegments) {
        if (timeSet.has(segment.timeSegment)) {
          duplicates.push(segment.timeSegment);
        } else {
          timeSet.add(segment.timeSegment);
        }
      }
      
      if (duplicates.length > 0) {
        message.error(`时间段重复：${duplicates.join(', ')}`);
        hide();
        return false;
      }
      
      // 按时间顺序排序
      fields.timeSegments.sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment));
      
      // 转换数据格式（百分比转小数）
      const configData = fields.timeSegments.map((segment: any) => ({
        timeSegment: segment.timeSegment,
        maBelowPercent: segment.maBelowPercent / 100,
        maAbovePercent: segment.maAbovePercent / 100,
        profitPercent: segment.profitPercent / 100,
      }));
      
      fields.timeSegmentMaConfig = JSON.stringify(configData);
    }
    
    // 从表单数据中移除timeSegments字段，因为后端不需要这个字段
    delete fields.timeSegments;
    
    console.log('处理后的更新数据:', JSON.stringify(fields, null, 2));
    
    try {
      await updateStrategyUserStock({
        ...currentRow,
        ...fields,
      });
      hide();
      message.success(intl.formatMessage({ id: 'pages.message.success' }));
      
      // 刷新表格
      if (actionRef.current) {
        actionRef.current.reload();
      }
      
      return true;
    } catch (error) {
      hide();
      console.error('更新策略用户股票关系失败:', error);
      message.error(intl.formatMessage({ id: 'pages.message.error' }));
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
  const handleUpdateOpeningBuy = async (id: number, enableOpeningBuy: number | null) => {
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
  const handleBatchUpdateOpeningBuy = async (enableOpeningBuy: number | null) => {
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
      // setSelectedRowKeys([]);
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
      // setSelectedRowKeys([]);
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
      // setSelectedRowKeys([]);
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
      // setSelectedRowKeys([]);
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
      // setSelectedRowKeys([]);
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
      // setSelectedRowKeys([]);
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
      // setSelectedRowKeys([]);
      setBatchTotalFundModalVisible(false);
    } catch (error) {
      console.error('批量更新最大持有买入单数失败:', error);
      message.error('批量更新最大持有买入单数失败');
    }
  };

  // 批量设置买入单数（综合设置）
  const handleBatchSetBuyOrder = async (values: any) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    const hide = message.loading('批量设置买入单数中...');
    
    try {
      const ids = selectedRowKeys.map(key => Number(key));
      const updatePromises = [];

      // 如果设置了未卖出堆栈值
      if (values.unsoldStackLimit !== undefined && values.unsoldStackLimit !== null) {
        updatePromises.push(
          batchUpdateStrategyUserStockUnsoldStackLimit({
            ids,
            unsoldStackLimit: values.unsoldStackLimit,
          })
        );
      }

      // 如果设置了限制开始份数
      if (values.limitStartShares !== undefined && values.limitStartShares !== null) {
        updatePromises.push(
          batchUpdateStrategyUserStockLimitStartShares({
            ids,
            limitStartShares: values.limitStartShares,
          })
        );
      }

      // 如果设置了最大持有买入单数
      if (values.totalFundShares !== undefined && values.totalFundShares !== null) {
        updatePromises.push(
          batchUpdateStrategyUserStockTotalFundShares({
            ids,
            totalFundShares: values.totalFundShares,
          })
        );
      }

      if (updatePromises.length === 0) {
        hide();
        message.warning('请至少设置一个参数');
        return false;
      }

      await Promise.all(updatePromises);
      hide();
      message.success(`已成功批量设置 ${selectedRowKeys.length} 条记录的买入单数配置`);
      // setSelectedRowKeys([]);
      actionRef.current?.reload();
      setBatchBuyOrderModalVisible(false);
      batchBuyOrderForm.resetFields();
      return true;
    } catch (error) {
      hide();
      console.error('批量设置买入单数失败:', error);
      message.error('批量设置买入单数失败');
      return false;
    }
  };

  // 加载模版列表
  const loadTemplates = async () => {
    try {
      const response = await getConfigTemplateList({ configType: 'user_stock' });
      if (response.success && response.data) {
        // 获取当前选中行的股票代码
        const selectedStockCodes = new Set<string>();
        if (selectedRowKeys.length > 0 && currentTableData.length > 0) {
          selectedRowKeys.forEach(key => {
            const record = currentTableData.find(item => item.id === key);
            if (record && record.stockCode) {
              selectedStockCodes.add(record.stockCode);
            }
          });
        }
        
        // 如果有选中的股票代码，则过滤模版列表
        let filteredTemplates = response.data;
        if (selectedStockCodes.size > 0) {
          filteredTemplates = response.data.filter(template => 
            !template.sourceStockCode || selectedStockCodes.has(template.sourceStockCode)
          );
        }
        
        setTemplates(filteredTemplates);
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
      // setSelectedRowKeys([]);
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
      // setSelectedRowKeys([]);
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
  const summaryData = useMemo(() => {
    let totalSingleAmount = 0;
    let totalDailyMaxHolding = 0;
    let totalMaxHolding = 0;
    let totalAccountAmount = 0;
    let maxStockAmount = 0;
    let maxStockCode = '';
    let maxStockSingleAmount = 0;
    
    // 新增统计字段
    let totalCount = 0;
    let enabledCount = 0;
    let disabledCount = 0;
    let recordCount = 0;
    const accountSet = new Set<string>();
    
    // 初始化市值规模统计
    const marketCapStats = {
      '小盘股': 0,
      '中盘股': 0,
      '大盘股': 0,
      'ETF': 0
    };

    currentTableData.forEach((record) => {
      recordCount++;
      
      // 统计总数和状态 - 修正为数字字符串判断
      totalCount++;
      if (record.status === '1') {
        enabledCount++;
      } else if (record.status === '0' || record.status !== '1') {
        disabledCount++;
      }
      
      // 统计账户
      if (record.account) {
        accountSet.add(record.account);
      }
      
      // 统计市值规模
      const strategyStock = strategyStockMap.get(`${record.strategyId}_${record.stockCode}`);
      if (strategyStock?.marketCapScale && marketCapStats.hasOwnProperty(strategyStock.marketCapScale)) {
        marketCapStats[strategyStock.marketCapScale as keyof typeof marketCapStats]++;
      }
      
      // 计算资金相关统计 - 暂时跳过有问题的属性
      try {
        const buyRatioConfig = parseBuyRatioConfig((record as any).buyRatioConfig || '');
        const singleAmount = calculateSingleAmount(record, buyRatioConfig);
        const dailyMaxHolding = calculateDailyMaxHolding(record, singleAmount);
        const maxHolding = calculateMaxHolding(record, buyRatioConfig, singleAmount);
        
        totalSingleAmount += singleAmount;
        totalDailyMaxHolding += dailyMaxHolding;
        totalMaxHolding += maxHolding;
        
        const accountAmount = accountTotalAmountMap.get(record.account || '') || 0;
        totalAccountAmount += accountAmount;
        
        if (maxHolding > maxStockAmount) {
          maxStockAmount = maxHolding;
          maxStockCode = record.stockCode || '';
          maxStockSingleAmount = singleAmount;
        }
      } catch (error) {
        // 如果计算出错，跳过这条记录的资金计算
        console.warn('计算资金统计时出错:', error);
      }
    });

    const singleAmountRatio = totalAccountAmount > 0 ? (totalSingleAmount / totalAccountAmount) * 100 : 0;
    const dailyMaxHoldingRatio = totalAccountAmount > 0 ? (totalDailyMaxHolding / totalAccountAmount) * 100 : 0;
    const maxHoldingRatio = totalAccountAmount > 0 ? (totalMaxHolding / totalAccountAmount) * 100 : 0;
    const maxStockRatio = totalAccountAmount > 0 ? (maxStockAmount / totalAccountAmount) * 100 : 0;
    const maxStockSingleRatio = totalAccountAmount > 0 ? (maxStockSingleAmount / totalAccountAmount) * 100 : 0;

    return {
      recordCount,
      accountCount: accountSet.size,
      totalSingleAmount,
      totalDailyMaxHolding,
      totalMaxHolding,
      totalAccountAmount,
      singleAmountRatio,
      dailyMaxHoldingRatio,
      maxHoldingRatio,
      maxStockCode,
      maxStockAmount,
      maxStockRatio,
      maxStockSingleAmount,
      maxStockSingleRatio,
      totalCount,
      enabledCount,
      disabledCount,
      marketCapStats
    };
  }, [currentTableData, strategyStockMap, accountTotalAmountMap]);

  // 表格列定义
  const columns: ProColumns<API.StrategyUserStockItem>[] = [
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
      hideInTable: true, // 隐藏Strategy列
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
      title: <FormattedMessage id="pages.strategy.user.stockRelation.stockCode" defaultMessage="Stock Code" />,
      dataIndex: 'stockCode',
      sorter: true,
      render: (text, record) => (
        <a
          onClick={() => {
            // 通过回调函数通知父组件切换到策略标的tab并打开时段配置对话框
            if (record.strategyId && record.stockCode && onStockClick) {
              onStockClick(record.strategyId, record.stockCode);
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
        <>
          <>市值规模</>
          <Tooltip title="股票的市值规模分类">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'marketCapScale',
      hideInSearch: true,
      render: (_, record) => {
        // 从strategyStockMap中获取市值规模信息
        const key = `${record.strategyId}_${record.stockCode}`;
        const strategyStock = strategyStockMap.get(key);
        const marketCapScale = strategyStock?.marketCapScale;
        
        if (!marketCapScale) {
          return <Tag color="default">未设置</Tag>;
        }
        
        const colorMap = {
          '小盘股': 'default',
          '中盘股': 'processing',
          '大盘股': 'success',
          'ETF': 'warning',
        };
        
        return (
          <Tag color={colorMap[marketCapScale as keyof typeof colorMap] || 'default'}>
            {marketCapScale}
          </Tag>
        );
      },
    },
    {
      title: (
        <>
          <>时段分时配置</>
          <Tooltip title="不同时段的分时平均线买入配置和盈利点(时段配置中的盈利点优先级最高)">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'timeSegmentMaConfig',
      valueType: 'text',
      hideInSearch: true,
      width: 280,
      render: (_, record) => {
        const levelText = (record as any).timeSegmentTemplateId 
          ? timeSegmentTemplateLevelMap.get((record as any).timeSegmentTemplateId) 
          : null;
        
        if (!(record as any).timeSegmentMaConfig) {
          return (
            <div>
              <Tag color="default">使用策略标的配置</Tag>
              {levelText && <Tag color="purple" style={{ marginTop: 2 }}>档位: {levelText}</Tag>}
            </div>
          );
        }
        
        try {
          const config = parseTimeSegmentMaConfig((record as any).timeSegmentMaConfig);
          if (!Array.isArray(config) || config.length === 0) {
            return (
              <div>
                <Tag color="default">使用策略标的配置</Tag>
                {levelText && <Tag color="purple" style={{ marginTop: 2 }}>档位: {levelText}</Tag>}
              </div>
            );
          }
          
          return (
            <div>
              {levelText && <Tag color="purple" style={{ marginBottom: 2 }}>档位: {levelText}</Tag>}
              {config.map((item: any, index: number) => (
                <Tag key={index} color="blue" style={{ marginBottom: 2 }}>
                  {item.timeSegment}: 分时下方{(item.maBelowPercent * 100).toFixed(2)}%/分时上方{(item.maAbovePercent * 100).toFixed(2)}%/盈利点{((item.profitPercent || 0) * 100).toFixed(2)}%
                </Tag>
              ))}
            </div>
          );
        } catch (error) {
          return (
            <div>
              <Tag color="red">配置错误</Tag>
              {levelText && <Tag color="purple" style={{ marginTop: 2 }}>档位: {levelText}</Tag>}
            </div>
          );
        }
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
      render: (_, record) => record.maxAmount ? `$${record.maxAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-',
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
        
        if (singleAmount <= 0) return '-';
        
        // 获取账户总资金
        const accountTotalAmount = record.account ? accountTotalAmountMap.get(record.account) : undefined;
        let percentageText = '';
        
        if (accountTotalAmount && accountTotalAmount > 0) {
          const percentage = (singleAmount / accountTotalAmount) * 100;
          percentageText = ` (${percentage.toFixed(2)}%)`;
        }
        
        return `$${singleAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${percentageText}`;
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
        
        return `$${dailyMaxHolding.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${percentageText}`;
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
        
        return `$${maxHolding.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${percentageText}`;
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
        const getNextValue = (current: number | null | undefined): number | null => {
          console.log('getNextValue - 当前值:', current, '类型:', typeof current);
          if (current === 1) {
            console.log('1 -> 0');
            return 0;
          }
          if (current === 0) {
            console.log('0 -> -1');
            return -1;
          }
          console.log('null/undefined/-1 -> 1');
          return 1; // null/-1 -> 1
        };
        
        const getDisplayText = (value: number | null | undefined): string => {
          if (value === 1) return '开启';
          if (value === 0) return '关闭';
          return '策略默认';
        };
        
        const getColor = (value: number | null | undefined): string => {
          if (value === 1) return '#52c41a';
          if (value === 0) return '#ff4d4f';
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
            // 直接设置原始记录数据，不进行转换
            setCurrentRow(record);
            setUpdateModalVisible(true);
          }}
        >
          <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
        </a>,
        <a
          key="timeSegmentConfig"
          onClick={() => handleTimeSegmentConfig(record)}
        >
          时段配置
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
  
  // 处理时段配置
  const handleTimeSegmentConfig = (record: API.StrategyUserStockItem) => {
    console.log('时段配置 - 传入的record:', record);
    console.log('时段配置 - record中的strategyId:', record.strategyId);
    console.log('时段配置 - record中的strategyName:', record.strategyName);
    
    setTimeSegmentCurrentRecord(record);
    setTimeSegmentModalVisible(true);
    
    // 解析现有配置并设置表单初始值
    const existingConfig = parseTimeSegmentMaConfig((record as any).timeSegmentMaConfig);
    if (existingConfig.length > 0) {
      const formValues = existingConfig.map(config => ({
        timeSegment: config.timeSegment,
        maBelowPercent: config.maBelowPercent * 100, // 转换为百分比显示
        maAbovePercent: config.maAbovePercent * 100,
        profitPercent: config.profitPercent * 100,
      }));
      timeSegmentForm.setFieldsValue({ timeSegments: formValues });
    } else {
      timeSegmentForm.setFieldsValue({ timeSegments: [] });
    }
  };

  // 生成默认时段配置
  const generateDefaultTimeSegments = () => {
    const defaultSegments = [
      { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1 },
      { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1 },
      { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1 },
    ];
    
    timeSegmentForm.setFieldsValue({ timeSegments: defaultSegments });
  };

  // 验证时间段格式
  const validateTimeSegment = (timeSegment: string) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeSegment);
  };

  // 时间转换为分钟数，用于排序
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 保存时段配置
  const handleSaveTimeSegmentConfig = async (values: any) => {
    if (!timeSegmentCurrentRecord) {
      message.error('未选择配置记录');
      return;
    }

    try {
      const timeSegments = values.timeSegments || [];
      
      // 验证时间段格式
      for (const segment of timeSegments) {
        if (!validateTimeSegment(segment.timeSegment)) {
          message.error(`时间段格式错误：${segment.timeSegment}，请使用HH:mm格式`);
          return;
        }
      }
      
      // 检查时间段是否重复
      const timeSet = new Set();
      const duplicates: string[] = [];
      
      for (const segment of timeSegments) {
        if (timeSet.has(segment.timeSegment)) {
          duplicates.push(segment.timeSegment);
        } else {
          timeSet.add(segment.timeSegment);
        }
      }
      
      if (duplicates.length > 0) {
        message.error(`时间段重复：${duplicates.join(', ')}`);
        return;
      }
      
      // 按时间顺序排序
      timeSegments.sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment));
      
      // 转换数据格式（百分比转小数）
      const configData = timeSegments.map((segment: any) => ({
        timeSegment: segment.timeSegment,
        maBelowPercent: segment.maBelowPercent / 100,
        maAbovePercent: segment.maAbovePercent / 100,
        profitPercent: segment.profitPercent / 100,
      }));
      
      const timeSegmentMaConfig = JSON.stringify(configData);
      
      // 使用单个更新接口
      await updateStrategyUserStockTimeSegmentConfig({
        id: timeSegmentCurrentRecord.id!,
        timeSegmentMaConfig,
      });
      
      message.success('时段配置保存成功');
      setTimeSegmentModalVisible(false);
      setTimeSegmentCurrentRecord(null);
      
      // 刷新表格
      if (actionRef.current) {
        actionRef.current.reload();
      }
      
      // 重新加载档位等级映射
      await loadTimeSegmentTemplateLevelMap();
    } catch (error) {
      console.error('保存时段配置失败:', error);
      message.error('保存时段配置失败');
    }
  };

  // 从策略标的获取时段配置
  const loadStrategyStockTimeSegmentConfig = async () => {
    if (!timeSegmentCurrentRecord) {
      message.error('未选择配置记录');
      return;
    }

    try {
      // 获取策略标的配置
      const strategyStockConfig = getStrategyStockConfig(
        timeSegmentCurrentRecord.strategyId,
        timeSegmentCurrentRecord.stockCode
      );
      
      if (!strategyStockConfig) {
        message.error('未找到对应的策略标的配置');
        return;
      }

      // 解析策略标的的时段配置
      const strategyTimeSegmentConfig = parseTimeSegmentMaConfig(strategyStockConfig.timeSegmentMaConfig);
      
      if (strategyTimeSegmentConfig.length === 0) {
        // 如果策略标的没有配置时段，使用默认配置
        const defaultSegments = [
          { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1 },
          { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1 },
          { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1 },
        ];
        timeSegmentForm.setFieldsValue({ timeSegments: defaultSegments });
        message.info('策略标的暂无时段配置，已加载默认配置');
      } else {
        // 转换为表单格式（百分比显示）
        // parseTimeSegmentMaConfig返回的是原始小数值，需要乘以100显示为百分比
        const formattedConfig = strategyTimeSegmentConfig.map((config: any) => ({
          timeSegment: config.timeSegment,
          maBelowPercent: config.maBelowPercent * 100,
          maAbovePercent: config.maAbovePercent * 100,
          profitPercent: config.profitPercent * 100,
        }));
        
        timeSegmentForm.setFieldsValue({ timeSegments: formattedConfig });
        message.success('已加载策略标的时段配置');
      }
    } catch (error) {
      console.error('加载策略标的时段配置失败:', error);
      message.error('加载策略标的时段配置失败');
    }
  };

  // 保存单个记录为档位配置
  const handleSaveAsTimeSegmentTemplate = (record: API.StrategyUserStockItem) => {
    // 设置档位配置初始值
    const initialValues = {
      templateName: `${record.stockCode}_${record.accountName}_档位`,
      useScenario: '用户股票时段配置',
      stockCode: record.stockCode,
      account: record.account,
      accountName: record.accountName,
      timeSegmentMaConfig: (record as any).timeSegmentMaConfig || '',
      strategyId: record.strategyId || strategyId,
      strategyName: record.strategyName || strategyName,
      configType: 'USER',
    };
    setTimeSegmentTemplateInitialValues(initialValues);
    setSaveTimeSegmentTemplateModalVisible(true);
  };

  // 保存档位配置
  const handleSaveTimeSegmentTemplate = async (values: any) => {
    console.log('保存档位配置 - 表单值:', values);
    
    const templateData = {
      ...values,
      configType: 'USER',
      // 使用表单中的strategyId和strategyName，如果没有则使用props中的值作为fallback
      strategyId: values.strategyId || strategyId,
      strategyName: values.strategyName || strategyName,
    };

    console.log('保存档位配置 - 最终数据:', templateData);

    // 处理409错误的公共函数
    const handle409Error = (errorData: any) => {
      console.log('检测到重复档位，显示确认对话框');
      
      Modal.confirm({
        title: '档位配置已存在',
        content: errorData.errorMessage || errorData.message || '该档位配置已存在，是否覆盖原档位？',
        okText: '覆盖',
        cancelText: '取消',
        width: 500,
        maskClosable: false,
        onOk: async () => {
          try {
            console.log('用户确认覆盖，开始强制覆盖保存');
            // 强制覆盖保存
            const overwriteResponse = await createTimeSegmentTemplate(templateData, true);
            console.log('强制覆盖保存 - 响应数据:', overwriteResponse);
            
            if (overwriteResponse.success) {
              message.success('档位配置覆盖保存成功');
              setSaveTimeSegmentTemplateModalVisible(false);
              saveTimeSegmentTemplateFormRef.current?.resetFields();
              setTimeSegmentTemplateInitialValues({});
              return true;
            } else {
              message.error('档位配置覆盖保存失败: ' + (overwriteResponse.errorMessage || overwriteResponse.message));
              return false;
            }
          } catch (overwriteError) {
            console.error('档位配置覆盖保存失败:', overwriteError);
            message.error('档位配置覆盖保存失败');
            return false;
          }
        },
        onCancel: () => {
          console.log('用户取消覆盖');
        }
      });
    };

    try {
      // 第一次尝试保存（不强制覆盖）
      const response = await createTimeSegmentTemplate(templateData, false);
      
      console.log('保存档位配置 - 响应数据:', response);
      
      if (response.success) {
        message.success('档位配置保存成功');
        setSaveTimeSegmentTemplateModalVisible(false);
        saveTimeSegmentTemplateFormRef.current?.resetFields();
        setTimeSegmentTemplateInitialValues({});
        return true;
      } else {
        console.log('保存档位配置 - 检查错误码:', response.errorCode, '类型:', typeof response.errorCode);
        
        // 使用更宽松的错误码比较
        if (response.errorCode === '409' || String(response.errorCode) === '409') {
          handle409Error(response);
          return false;
        } else {
          message.error('档位配置保存失败: ' + (response.errorMessage || response.message));
          return false;
        }
      }
    } catch (error: any) {
      console.error('档位配置保存失败 - catch块:', error);
      
      // 检查是否是BizError类型的409错误
      if (error.name === 'BizError' && error.info) {
        const errorInfo = error.info;
        console.log('BizError信息:', errorInfo);
        
        if (errorInfo.errorCode === 409 || errorInfo.errorCode === '409' || String(errorInfo.errorCode) === '409') {
          console.log('检测到BizError类型的重复档位错误');
          handle409Error(errorInfo);
          return false;
        }
      }
      
      // 检查是否是HTTP响应错误中的409错误
      if (error?.response?.data) {
        const errorData = error.response.data;
        console.log('HTTP响应错误数据:', errorData);
        
        if (errorData.errorCode === 409 || errorData.errorCode === '409' || String(errorData.errorCode) === '409') {
          console.log('检测到HTTP响应类型的重复档位错误');
          handle409Error(errorData);
          return false;
        }
      }
      
      // 其他错误
      message.error('档位配置保存失败');
      return false;
    }
  };

  // 获取档位等级选项
  const loadTemplateLevels = async () => {
    try {
      const response = await request('/api/timeSegmentTemplate/templateLevels');
      if (response.success) {
        setTemplateLevels(response.data);
      }
    } catch (error) {
      console.error('获取档位等级失败:', error);
    }
  };

  // 根据档位等级获取模板
  const loadTemplatesByLevel = async (level: string) => {
    try {
      const response = await listTimeSegmentTemplatesByLevel({
        templateLevel: level,
        configType: 'USER',
        strategyId: strategyId,
      });
      
      if (response.success && response.data) {
        setTemplatesByLevel(response.data);
      } else {
        setTemplatesByLevel([]);
      }
    } catch (error) {
      console.error('加载档位配置失败:', error);
      setTemplatesByLevel([]);
    }
  };

  // 加载档位等级映射
  const loadTimeSegmentTemplateLevelMap = async () => {
    try {
      const response = await listTimeSegmentTemplates({
        configType: 'USER',
        strategyId: strategyId,
        current: 1,
        pageSize: 1000, // 获取所有档位
      });
      
      if (response.success && response.data && response.data.records) {
        const levelMap = new Map<number, string>();
        response.data.records.forEach((template: any) => {
          if (template.id && template.templateLevel) {
            levelMap.set(template.id, template.templateLevel);
          }
        });
        setTimeSegmentTemplateLevelMap(levelMap);
      }
    } catch (error) {
      console.error('加载档位等级映射失败:', error);
    }
  };

  // 应用档位模板
  const applyTemplate = async (templateId: number) => {
    if (!timeSegmentCurrentRecord) return;
    
    try {
      const template = await getTimeSegmentTemplateById(templateId);
      if (!template.success || !template.data) {
        message.error('获取档位配置失败');
        return;
      }
      
      const templateData = template.data;
      
      // 应用档位配置到用户股票关系
      const applyResponse = await applyTimeSegmentTemplateToUserStock({
        templateId: templateId,
        userStockIds: [timeSegmentCurrentRecord.id!],
      });
      
      if (applyResponse.success) {
        message.success('应用档位配置成功');
        
        // 重新加载时段配置到表单
        if (templateData.timeSegmentMaConfig) {
          const parsedConfig = parseTimeSegmentMaConfig(templateData.timeSegmentMaConfig);
          const formattedConfig = parsedConfig.map((config: any) => ({
            timeSegment: config.timeSegment,
            maBelowPercent: config.maBelowPercent * 100,
            maAbovePercent: config.maAbovePercent * 100,
            profitPercent: config.profitPercent * 100,
          }));
          timeSegmentForm.setFieldsValue({ timeSegments: formattedConfig });
        }
        
        actionRef.current?.reload();
        
        // 重新加载档位等级映射
        await loadTimeSegmentTemplateLevelMap();
      } else {
        message.error('应用档位配置失败');
      }
    } catch (error) {
      console.error('应用档位配置失败:', error);
      message.error('应用档位配置失败');
    }
  };

  // 保存当前配置为档位
  const saveAsTemplate = async () => {
    try {
      const values = await timeSegmentForm.validateFields();
      const timeSegments = values.timeSegments || [];
      
      if (timeSegments.length === 0) {
        message.error('请先配置时段信息');
        return;
      }

      // 调试信息：打印当前记录和props中的策略信息
      console.log('保存档位配置 - 调试信息:', {
        timeSegmentCurrentRecord: timeSegmentCurrentRecord,
        strategyIdFromRecord: timeSegmentCurrentRecord?.strategyId,
        strategyNameFromRecord: timeSegmentCurrentRecord?.strategyName,
        strategyIdFromProps: strategyId,
        strategyNameFromProps: strategyName
      });

      // 转换数据格式（百分比转小数）
      const configData = timeSegments.map((segment: any) => ({
        timeSegment: segment.timeSegment,
        maBelowPercent: segment.maBelowPercent / 100,
        maAbovePercent: segment.maAbovePercent / 100,
        profitPercent: segment.profitPercent / 100,
      }));

      const timeSegmentMaConfig = JSON.stringify(configData);

      // 设置档位配置初始值
      const initialValues = {
        templateName: `${timeSegmentCurrentRecord?.stockCode}_${timeSegmentCurrentRecord?.accountName}_${selectedTemplateLevel}档`,
        templateLevel: selectedTemplateLevel || 'A',
        useScenario: '用户股票时段配置',
        stockCode: timeSegmentCurrentRecord?.stockCode,
        account: timeSegmentCurrentRecord?.account,
        accountName: timeSegmentCurrentRecord?.accountName,
        timeSegmentMaConfig: timeSegmentMaConfig,
        strategyId: timeSegmentCurrentRecord?.strategyId || strategyId,
        strategyName: timeSegmentCurrentRecord?.strategyName || strategyName,
        configType: 'USER',
      };

      console.log('保存档位配置 - 初始值:', initialValues);
      
      setTimeSegmentTemplateInitialValues(initialValues);
      setSaveTimeSegmentTemplateModalVisible(true);
    } catch (error) {
      console.error('保存档位配置失败:', error);
      message.error('请完善时段配置信息');
    }
  };

  // 初始化档位等级选项
  useEffect(() => {
    loadTemplateLevels();
  }, []);

  // 当选择档位等级时加载对应模板
  useEffect(() => {
    if (selectedTemplateLevel) {
      loadTemplatesByLevel(selectedTemplateLevel);
    }
  }, [selectedTemplateLevel, strategyId, timeSegmentCurrentRecord?.stockCode]);

  // 加载时段配置档位列表
  const loadTimeSegmentTemplates = async (searchParams?: any) => {
    try {
      const searchConditions = {
        configType: 'USER',
        strategyId: strategyId,
        current: 1,
        pageSize: 1000,
        ...searchParams,
      };

      const response = await listTimeSegmentTemplates(searchConditions);
      if (response.success && response.data) {
        setTimeSegmentTemplates(response.data.records || []);
      }
    } catch (error) {
      console.error('加载时段配置档位列表失败:', error);
    }
  };

  // 应用时段配置档位
  const handleApplyTimeSegmentTemplate = async () => {
    if (!selectedTimeSegmentTemplate || !timeSegmentCurrentRecord) {
      message.error('请选择要应用的档位配置');
      return;
    }

    try {
      const template = await getTimeSegmentTemplateById(selectedTimeSegmentTemplate);
      if (!template.success || !template.data) {
        message.error('获取档位配置失败');
        return;
      }

      const templateData = template.data;

      // 应用档位配置到用户股票关系
      const applyResponse = await applyTimeSegmentTemplateToUserStock({
        templateId: selectedTimeSegmentTemplate,
        userStockIds: [timeSegmentCurrentRecord.id!],
      });

      if (applyResponse.success) {
        message.success('应用档位配置成功');
        
        // 重新加载时段配置到表单
        if (templateData.timeSegmentMaConfig) {
          const parsedConfig = parseTimeSegmentMaConfig(templateData.timeSegmentMaConfig);
          const formattedConfig = parsedConfig.map((config: any) => ({
            timeSegment: config.timeSegment,
            maBelowPercent: config.maBelowPercent * 100,
            maAbovePercent: config.maAbovePercent * 100,
            profitPercent: config.profitPercent * 100,
          }));
          timeSegmentForm.setFieldsValue({ timeSegments: formattedConfig });
        }
        
        actionRef.current?.reload();
        
        // 重新加载档位等级映射
        await loadTimeSegmentTemplateLevelMap();
        
        // 关闭应用档位对话框
        setApplyTimeSegmentTemplateModalVisible(false);
        setSelectedTimeSegmentTemplate(undefined);
        timeSegmentTemplateSearchForm.resetFields();
        setTimeSegmentTemplateSearchParams({
          stockCode: '',
          templateLevel: '',
          account: '',
        });
      } else {
        message.error('应用档位配置失败');
      }
    } catch (error) {
      console.error('应用档位配置失败:', error);
      message.error('应用档位配置失败');
    }
  };

  // 删除时段配置档位
  const handleDeleteTimeSegmentTemplate = async (id: number) => {
    try {
      const response = await deleteTimeSegmentTemplate(id);
      if (response.success) {
        message.success('删除档位配置成功');
        loadTimeSegmentTemplates();
      } else {
        message.error('删除档位配置失败');
      }
    } catch (error) {
      console.error('删除档位配置失败:', error);
      message.error('删除档位配置失败');
    }
  };

  // 档位搜索
  const handleTimeSegmentTemplateSearch = () => {
    const searchValues = timeSegmentTemplateSearchForm.getFieldsValue();
    setTimeSegmentTemplateSearchParams(searchValues);
    loadTimeSegmentTemplates(searchValues);
  };

  // 重置档位搜索
  const handleTimeSegmentTemplateSearchReset = () => {
    timeSegmentTemplateSearchForm.resetFields();
    const resetParams = {
      stockCode: '',
      templateLevel: '',
      account: '',
    };
    setTimeSegmentTemplateSearchParams(resetParams);
    loadTimeSegmentTemplates(resetParams);
  };

  // 批量设置买入单数相关状态
  const [batchBuyOrderModalVisible, setBatchBuyOrderModalVisible] = useState<boolean>(false);
  const [batchBuyOrderForm] = Form.useForm();

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
              prefix={'$'}
              value={summaryData.totalAccountAmount}
              valueStyle={{ color: '#52c41a' }}
              formatter={(value) => Math.round(Number(value) || 0).toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="单次资金总计" 
              prefix={'$'}
              value={summaryData.totalSingleAmount}
              suffix={`(${summaryData.singleAmountRatio.toFixed(2)}%)`}
              valueStyle={{ color: '#faad14' }}
              formatter={(value) => Math.round(Number(value) || 0).toLocaleString()}
            />
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="单天最大持有资金" 
              prefix={'$'}
              value={summaryData.totalDailyMaxHolding}
              suffix={`(${summaryData.dailyMaxHoldingRatio.toFixed(2)}%)`}
              valueStyle={{ color: '#f5222d' }}
              formatter={(value) => Math.round(Number(value) || 0).toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="最大持有资金" 
              value={summaryData.totalMaxHolding}
              prefix={'$'}
              suffix={`(${summaryData.maxHoldingRatio.toFixed(2)}%)`}
              valueStyle={{ color: '#fa541c' }}
              formatter={(value) => Math.round(Number(value) || 0).toLocaleString()}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="资金最大使用股票单次资金" 
              value={summaryData.maxStockCode ? `${summaryData.maxStockCode}($${Math.round(summaryData.maxStockSingleAmount).toLocaleString()}/${summaryData.maxStockSingleRatio.toFixed(2)}%)` : '无'}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic 
              title="资金最大使用股票总资金" 
              value={summaryData.maxStockCode ? `${summaryData.maxStockCode}($${Math.round(summaryData.maxStockAmount).toLocaleString()}/${summaryData.maxStockRatio.toFixed(2)}%)` : '无'}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      </Card>
      
      {/* 市值规模和状态统计 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={3}>
            <Statistic title="股票总数" value={summaryData.totalCount || 0} />
          </Col>
          <Col span={3}>
            <Statistic title="启用" value={summaryData.enabledCount || 0} valueStyle={{ color: '#3f8600' }} />
          </Col>
          <Col span={3}>
            <Statistic title="禁用" value={summaryData.disabledCount || 0} valueStyle={{ color: '#cf1322' }} />
          </Col>
          <Col span={3}>
            <Statistic 
              title="小盘股" 
              value={summaryData.marketCapStats?.小盘股 || 0} 
              valueStyle={{ color: '#666' }} 
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="中盘股" 
              value={summaryData.marketCapStats?.中盘股 || 0} 
              valueStyle={{ color: '#1890ff' }} 
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="大盘股" 
              value={summaryData.marketCapStats?.大盘股 || 0} 
              valueStyle={{ color: '#52c41a' }} 
            />
          </Col>
          <Col span={3}>
            <Statistic 
              title="ETF" 
              value={summaryData.marketCapStats?.ETF || 0} 
              valueStyle={{ color: '#faad14' }} 
            />
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
            onClick={() => {
              // 获取搜索表单中的值
              const searchValues = searchFormRef.current?.getFieldsValue() || {};
              
              // 打开新增表单
              setCreateModalVisible(true);
              
              // 延迟设置初始值，确保表单已经渲染
              setTimeout(() => {
                if (createFormRef.current) {
                  const initialValues: any = {};
                  
                  // 如果搜索条件中有策略ID，则填充到表单中
                  if (searchValues.strategyId) {
                    initialValues.strategyId = searchValues.strategyId;
                    
                    // 查找对应的策略名称
                    const strategyOption = strategyOptions.find(option => option.value === searchValues.strategyId);
                    if (strategyOption) {
                      initialValues.strategyName = strategyOption.label.split(' (ID:')[0];
                    }
                  }
                  // 如果没有从搜索条件获取到策略，且当前不是特定策略页面，则选择第一个策略
                  else if (!strategyId && strategyOptions.length > 0) {
                    const firstStrategy = strategyOptions[0];
                    initialValues.strategyId = firstStrategy.value;
                    initialValues.strategyName = firstStrategy.label.split(' (ID:')[0];
                  }
                  
                  // 如果搜索条件中有账户，则填充到表单中
                  if (searchValues.account) {
                    initialValues.account = searchValues.account;
                    
                    // 查找对应的账户名称
                    const accountOption = accountOptions.find(option => option.value === searchValues.account);
                    if (accountOption) {
                      // 从label中提取账户名称，格式为 "账户号 (账户名称)"
                      const accountName = accountOption.label.match(/\((.+?)\)$/)?.[1];
                      if (accountName) {
                        initialValues.accountName = accountName;
                      }
                    }
                  }
                  
                  // 设置表单初始值
                  createFormRef.current.setFieldsValue(initialValues);
                }
              }, 100);
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.common.new" defaultMessage="New" />
          </Button>,
          <Button
            key="batch-new"
            type="primary"
            onClick={() => {
              // 获取搜索表单中的值
              const searchValues = searchFormRef.current?.getFieldsValue() || {};
              
              // 打开批量新增表单
              setBatchCreateModalVisible(true);
              
              // 延迟设置初始值，确保表单已经渲染
              setTimeout(() => {
                if (batchCreateFormRef.current) {
                  const initialValues: any = {};
                  
                  // 如果搜索条件中有策略ID，则填充到表单中
                  if (searchValues.strategyId) {
                    initialValues.strategyId = searchValues.strategyId;
                    
                    // 查找对应的策略名称
                    const strategyOption = strategyOptions.find(option => option.value === searchValues.strategyId);
                    if (strategyOption) {
                      initialValues.strategyName = strategyOption.label.split(' (ID:')[0];
                    }
                  }
                  // 如果没有从搜索条件获取到策略，且当前不是特定策略页面，则选择第一个策略
                  else if (!strategyId && strategyOptions.length > 0) {
                    const firstStrategy = strategyOptions[0];
                    initialValues.strategyId = firstStrategy.value;
                    initialValues.strategyName = firstStrategy.label.split(' (ID:')[0];
                  }
                  
                  // 如果搜索条件中有账户，则填充到表单中（批量新增支持多选账户）
                  if (searchValues.account) {
                    initialValues.accounts = [searchValues.account];
                  }
                  
                  // 设置表单初始值
                  batchCreateFormRef.current.setFieldsValue(initialValues);
                }
              }, 100);
            }}
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
                    onClick: () => handleBatchUpdateOpeningBuy(1),
                  },
                  {
                    key: '2',
                    label: '批量关闭开盘买入',
                    onClick: () => handleBatchUpdateOpeningBuy(0),
                  },
                  {
                    key: '3',
                    label: '批量设为策略默认',
                    onClick: () => handleBatchUpdateOpeningBuy(-1),
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
            批量启用禁用
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
                  {
                    key: '8',
                    label: '批量设置买入单数',
                    onClick: () => {
                      if (selectedRowKeys.length === 0) {
                        message.warning('请先选择要更新的记录');
                        return;
                      }
                      setBatchBuyOrderModalVisible(true);
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
        scroll={{
          y: 'calc(100vh - 400px)', // 固定表头，设置表格高度
          x: 'max-content', // 支持横向滚动
        }}
        pagination={{
          defaultPageSize: 1000,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['100', '1000', '2000'],
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
        }}
      />
      
      {/* 新增策略用户股票关系表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.user.stockRelation.create" defaultMessage="Create Strategy User Stock Relation" />}
        width="650px"
        formRef={createFormRef}
        form={createForm}
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
            onClick={async () => {
              try {
                // 先验证表单
                const values = await createForm.validateFields();
                console.log('表单验证通过，获取到的值:', JSON.stringify(values, null, 2));
                
                // 手动调用handleAdd
                const success = await handleAdd(values);
                if (success) {
                  setCreateModalVisible(false);
                  createForm.resetFields();
                }
              } catch (error) {
                console.error('表单验证失败:', error);
              }
            }}
          >
            确定
          </Button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
                  if (createForm && option?.strategyName) {
                    createForm.setFieldsValue({
                      strategyName: option.strategyName,
                    });
                  }
                },
              }}
            />
          </div>
          
          <ProFormText
            name="strategyName"
            label={<FormattedMessage id="pages.strategy.job.name" defaultMessage="Strategy Name" />}
            rules={[{ required: true }]}
            hidden
          />
          
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
                  if (createForm && option?.accountName) {
                    createForm.setFieldsValue({
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
              rules={[
                {
                  validator: (_: any, value: any) => {
                    const maxAmount = createForm.getFieldValue('maxAmount');
                    if (!value && !maxAmount) {
                      return Promise.reject(new Error('资金占比和最大金额至少需要填入一个'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="maxAmount"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.maxAmount" defaultMessage="Max Amount" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.maxAmount.placeholder', defaultMessage: '填入最大资金' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.maxAmountTip' })}
              min={0}
              rules={[
                {
                  validator: (_: any, value: any) => {
                    const fundPercent = createForm.getFieldValue('fundPercent');
                    if (!value && !fundPercent) {
                      return Promise.reject(new Error('资金占比和最大金额至少需要填入一个'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
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
                '1': '开启',
                '0': '关闭',
                '-1': '使用策略默认',
              }}
              initialValue="-1"
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
          
          {/* 时段分时平均线配置 */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <ProFormList
              name="timeSegments"
              label="时段分时平均线配置"
              tooltip="配置不同时段的分时平均线买入策略"
              creatorButtonProps={{
                creatorButtonText: '添加时段',
                type: 'dashed',
                style: { width: '100%' },
              }}
              copyIconProps={false}
              deleteIconProps={{
                tooltipText: '删除时段',
              }}
              itemRender={({ listDom, action }, { record, index }) => (
                <div
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {listDom}
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => {
                          // 从action元素中提取onClick事件
                          if (action && typeof action === 'object' && 'props' in action && action.props.onClick) {
                            action.props.onClick();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>时段开始时间</div>
                  <ProFormText
                    name="timeSegment"
                    placeholder="09:30"
                    rules={[
                      { required: true, message: '请输入时段开始时间' },
                      { 
                        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                        message: '时间格式错误，请使用HH:mm格式' 
                      }
                    ]}
                    fieldProps={{
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>下方百分比</div>
                  <ProFormDigit
                    name="maBelowPercent"
                    placeholder="0.5"
                    rules={[{ required: true, message: '请输入下方百分比' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>上方百分比</div>
                  <ProFormDigit
                    name="maAbovePercent"
                    placeholder="0.1"
                    rules={[{ required: true, message: '请输入上方百分比' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>盈利点</div>
                  <ProFormDigit
                    name="profitPercent"
                    placeholder="1.0"
                    rules={[{ required: true, message: '请输入盈利点' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
              </div>
            </ProFormList>
            
            <div style={{ marginTop: '8px' }}>
              <Button 
                type="dashed" 
                onClick={() => {
                  const currentSegments = createForm.getFieldValue('timeSegments') || [];
                  const defaultSegments = [
                    { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1 },
                    { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1 },
                    { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1 },
                  ];
                  createForm.setFieldsValue({ timeSegments: defaultSegments });
                }}
                style={{ width: '100%' }}
              >
                重置为默认时段
              </Button>
            </div>
            
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              <p><strong>说明：</strong></p>
              <p>• 时段开始时间：该时段配置的生效时间，格式为HH:mm</p>
              <p>• 分时平均线下方百分比：股价低于分时平均线的百分比阈值</p>
              <p>• 分时平均线上方百分比：股价高于分时平均线的百分比阈值</p>
              <p>• 盈利点：该时段的盈利目标百分比</p>
            </div>
          </div>
        </div>
      </ModalForm>
      
      {/* 编辑策略用户股票关系表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.user.stockRelation.edit" defaultMessage="Edit Strategy User Stock Relation" />}
        width="650px"
        formRef={updateFormRef}
        form={updateForm}
        modalProps={{
          destroyOnClose: true,
          footer: null, // 隐藏默认底部按钮
        }}
        open={updateModalVisible}
        onOpenChange={(visible) => {
          setUpdateModalVisible(visible);
          if (!visible) {
            setCurrentRow(undefined);
            updateForm.resetFields(); // 清空表单值
          }
        }}
        onFinish={handleUpdate}
        submitter={false} // 禁用默认提交按钮
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
              updateForm.submit();
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
              rules={[
                {
                  validator: (_: any, value: any) => {
                    const maxAmount = updateForm.getFieldValue('maxAmount');
                    if (!value && !maxAmount) {
                      return Promise.reject(new Error('资金占比和最大金额至少需要填入一个'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="maxAmount"
              label={<FormattedMessage id="pages.strategy.user.stockRelation.maxAmount" defaultMessage="Max Amount" />}
              placeholder={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.maxAmount.placeholder', defaultMessage: 'Leave empty to use Fund Percent' })}
              tooltip={intl.formatMessage({ id: 'pages.strategy.user.stockRelation.maxAmountTip' })}
              min={0}
              rules={[
                {
                  validator: (_: any, value: any) => {
                    const fundPercent = updateForm.getFieldValue('fundPercent');
                    if (!value && !fundPercent) {
                      return Promise.reject(new Error('资金占比和最大金额至少需要填入一个'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
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
              initialValue={2}
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
              initialValue={5}
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
              initialValue={10}
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
                '1': '开启',
                '0': '关闭',
                '-1': '使用策略默认',
              }}
              initialValue="-1"
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
          
          {/* 时段分时平均线配置 */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <ProFormList
              name="timeSegments"
              label="时段分时平均线配置"
              tooltip="配置不同时段的分时平均线买入策略"
              creatorButtonProps={{
                creatorButtonText: '添加时段',
                type: 'dashed',
                style: { width: '100%' },
              }}
              copyIconProps={false}
              deleteIconProps={{
                tooltipText: '删除时段',
              }}
              itemRender={({ listDom, action }, { record, index }) => (
                <div
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {listDom}
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => {
                          // 从action元素中提取onClick事件
                          if (action && typeof action === 'object' && 'props' in action && action.props.onClick) {
                            action.props.onClick();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>时段开始时间</div>
                  <ProFormText
                    name="timeSegment"
                    placeholder="09:30"
                    rules={[
                      { required: true, message: '请输入时段开始时间' },
                      { 
                        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                        message: '时间格式错误，请使用HH:mm格式' 
                      }
                    ]}
                    fieldProps={{
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>下方百分比</div>
                  <ProFormDigit
                    name="maBelowPercent"
                    placeholder="0.5"
                    rules={[{ required: true, message: '请输入下方百分比' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>上方百分比</div>
                  <ProFormDigit
                    name="maAbovePercent"
                    placeholder="0.1"
                    rules={[{ required: true, message: '请输入上方百分比' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>盈利点</div>
                  <ProFormDigit
                    name="profitPercent"
                    placeholder="1.0"
                    rules={[{ required: true, message: '请输入盈利点' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
              </div>
            </ProFormList>
            
            <div style={{ marginTop: '8px' }}>
              <Button 
                type="dashed" 
                onClick={() => {
                  const currentSegments = updateForm.getFieldValue('timeSegments') || [];
                  const defaultSegments = [
                    { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1 },
                    { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1 },
                    { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1 },
                  ];
                  updateForm.setFieldsValue({ timeSegments: defaultSegments });
                }}
                style={{ width: '100%' }}
              >
                重置为默认时段
              </Button>
            </div>
            
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              <p><strong>说明：</strong></p>
              <p>• 时段开始时间：该时段配置的生效时间，格式为HH:mm</p>
              <p>• 下方百分比：股价低于分时平均线的百分比阈值</p>
              <p>• 上方百分比：股价高于分时平均线该百分比时买入，可为负数<br/>
                • 盈利点：股价高于分时平均线该百分比时买入，可为负数<br/>
                • 系统会自动检查时间段重复并按时间顺序排序<br/>
                • 默认时间段：09:30(0.5%,0.1%,0.1%), 12:00(1.0%,-0.5%,-0.5%), 14:00(1.5%,-1.0%,-1.0%)
              </p>
            </div>
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
            // setSelectedRowKeys([]);
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
        {/* 显示当前过滤的股票代码 */}
        {selectedRowKeys.length > 0 && currentTableData.length > 0 && (
          <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#f0f8ff', borderRadius: 4 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>当前筛选股票：</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {Array.from(new Set(
                selectedRowKeys.map(key => {
                  const record = currentTableData.find(item => item.id === key);
                  return record?.stockCode;
                }).filter(Boolean)
              )).join(', ')}
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: 4 }}>
              只显示与这些股票代码匹配的模版
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: 16 }}>
          <h4>选择要应用的模版：</h4>
          <Radio.Group 
            value={selectedTemplate} 
            onChange={(e) => setSelectedTemplate(e.target.value)}
            style={{ width: '100%' }}
          >
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                  暂无匹配的模版
                </div>
              ) : (
                templates.map((template: API.StrategyConfigTemplateItem) => (
                  <div key={template.id} style={{ 
                    padding: 12, 
                    border: '1px solid #d9d9d9', 
                    borderRadius: 4, 
                    marginBottom: 8,
                    backgroundColor: selectedTemplate === template.id ? '#e6f7ff' : '#fff',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12
                  }}>
                    <Radio value={template.id} style={{ marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{template.name}</div>
                          {template.applicableScenario && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                              {template.applicableScenario}
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
                  </div>
                ))
              )}
            </div>
          </Radio.Group>
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
                      总资金: ${account.totalAmount ? account.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      可用资金: ${account.availableAmount ? account.availableAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 0}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      证券市值: ${account.marketVal ? account.marketVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : 0}
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
              rules={[
                {
                  validator: (_: any, value: any) => {
                    const maxAmount = batchCreateForm.getFieldValue('maxAmount');
                    if (!value && !maxAmount) {
                      return Promise.reject(new Error('资金占比和最大金额至少需要填入一个'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            />
          </div>
          
          <div style={{ width: 'calc(33.33% - 8px)' }}>
            <ProFormDigit
              name="maxAmount"
              label="最大金额"
              placeholder="留空则使用资金百分比"
              tooltip="投入的最大金额，与资金百分比二选一"
              min={0}
              rules={[
                {
                  validator: (_: any, value: any) => {
                    const fundPercent = batchCreateForm.getFieldValue('fundPercent');
                    if (!value && !fundPercent) {
                      return Promise.reject(new Error('资金占比和最大金额至少需要填入一个'));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
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
                '1': '开启',
                '0': '关闭',
                '-1': '使用策略默认',
              }}
              initialValue="-1"
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
          
          {/* 时段分时平均线配置 */}
          <div style={{ width: '100%', marginTop: '16px' }}>
            <ProFormList
              name="timeSegments"
              label="时段分时平均线配置"
              tooltip="配置不同时段的分时平均线买入策略"
              creatorButtonProps={{
                creatorButtonText: '添加时段',
                type: 'dashed',
                style: { width: '100%' },
              }}
              copyIconProps={false}
              deleteIconProps={{
                tooltipText: '删除时段',
              }}
              itemRender={({ listDom, action }, { record, index }) => (
                <div
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    backgroundColor: '#fafafa',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {listDom}
                    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        size="small"
                        onClick={() => {
                          // 从action元素中提取onClick事件
                          if (action && typeof action === 'object' && 'props' in action && action.props.onClick) {
                            action.props.onClick();
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', width: '100%' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>时段开始时间</div>
                  <ProFormText
                    name="timeSegment"
                    placeholder="09:30"
                    rules={[
                      { required: true, message: '请输入时段开始时间' },
                      { 
                        pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                        message: '时间格式错误，请使用HH:mm格式' 
                      }
                    ]}
                    fieldProps={{
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>下方百分比</div>
                  <ProFormDigit
                    name="maBelowPercent"
                    placeholder="0.5"
                    rules={[{ required: true, message: '请输入下方百分比' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>上方百分比</div>
                  <ProFormDigit
                    name="maAbovePercent"
                    placeholder="0.1"
                    rules={[{ required: true, message: '请输入上方百分比' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>盈利点</div>
                  <ProFormDigit
                    name="profitPercent"
                    placeholder="1.0"
                    rules={[{ required: true, message: '请输入盈利点' }]}
                    min={-100}
                    max={100}
                    fieldProps={{
                      precision: 2,
                      addonAfter: '%',
                      style: { width: '100%' }
                    }}
                    formItemProps={{
                      style: { marginBottom: '0' }
                    }}
                  />
                </div>
              </div>
            </ProFormList>
            
            <div style={{ marginTop: '8px' }}>
              <Button 
                type="dashed" 
                onClick={() => {
                  const currentSegments = createForm.getFieldValue('timeSegments') || [];
                  const defaultSegments = [
                    { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1 },
                    { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1 },
                    { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1 },
                  ];
                  createForm.setFieldsValue({ timeSegments: defaultSegments });
                }}
                style={{ width: '100%' }}
              >
                重置为默认时段
              </Button>
            </div>
            
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
              <p><strong>说明：</strong></p>
              <p>• 时段开始时间：该时段配置的生效时间，格式为HH:mm</p>
              <p>• 下方百分比：股价低于分时平均线的百分比阈值</p>
              <p>• 上方百分比：股价高于分时平均线该百分比时买入，可为负数<br/>
                • 盈利点：股价高于分时平均线该百分比时买入，可为负数<br/>
                • 系统会自动检查时间段重复并按时间顺序排序<br/>
                • 默认时间段：09:30(0.5%,0.1%,0.1%), 12:00(1.0%,-0.5%,-0.5%), 14:00(1.5%,-1.0%,-1.0%)
              </p>
            </div>
          </div>
        </div>
      </ModalForm>
      
      {/* 时段配置Modal */}
      <Modal
        title={`时段配置 - ${timeSegmentCurrentRecord?.stockCode || ''} (${timeSegmentCurrentRecord?.accountName || ''})`}
        open={timeSegmentModalVisible}
        onCancel={() => {
          setTimeSegmentModalVisible(false);
          setTimeSegmentCurrentRecord(null);
          timeSegmentForm.resetFields();
          // 刷新列表数据
          actionRef.current?.reload();
        }}
        footer={null}
        width={1200}
      >
        <div style={{ marginBottom: 24 }}>
          {/* 操作按钮区域 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 12, 
            marginBottom: 16,
            padding: 16,
            backgroundColor: '#f5f5f5',
            borderRadius: 6,
            border: '1px solid #d9d9d9'
          }}>
            <Button 
              onClick={() => {
                setTimeSegmentModalVisible(false);
                setTimeSegmentCurrentRecord(null);
                timeSegmentForm.resetFields();
                // 刷新列表数据
                actionRef.current?.reload();
              }}
            >
              取消
            </Button>
            <Button 
              type="dashed" 
              onClick={generateDefaultTimeSegments}
              icon={<ThunderboltOutlined />}
            >
              重置为默认
            </Button>
            <Button
              type="dashed"
              onClick={loadStrategyStockTimeSegmentConfig}
            >
              加载策略标的配置
            </Button>
            <Button 
              type="dashed"
              onClick={() => {
                // 获取当前时段配置数据
                const currentTimeSegments = timeSegmentForm.getFieldValue('timeSegments') || [];
                
                // 将百分比转换为小数
                const convertedTimeSegments = currentTimeSegments.map((segment: any) => ({
                  timeSegment: segment.timeSegment,
                  maBelowPercent: segment.maBelowPercent / 100,
                  maAbovePercent: segment.maAbovePercent / 100,
                  profitPercent: segment.profitPercent / 100,
                }));
                
                const timeSegmentMaConfig = JSON.stringify(convertedTimeSegments);
                
                const initialValues = {
                  templateName: `${timeSegmentCurrentRecord?.stockCode || ''}_${timeSegmentCurrentRecord?.accountName || ''}_档位`,
                  useScenario: '用户股票时段配置',
                  stockCode: timeSegmentCurrentRecord?.stockCode,
                  account: timeSegmentCurrentRecord?.account,
                  accountName: timeSegmentCurrentRecord?.accountName,
                  strategyId: timeSegmentCurrentRecord?.strategyId || strategyId,
                  strategyName: timeSegmentCurrentRecord?.strategyName || strategyName,
                  timeSegmentMaConfig: timeSegmentMaConfig,
                  configType: 'USER',
                };
                console.log('保存为档位 - 设置初始值:', initialValues);
                setTimeSegmentTemplateInitialValues(initialValues);
                setSaveTimeSegmentTemplateModalVisible(true);
              }}
            >
              保存为档位
            </Button>
            <Button 
              type="dashed"
              onClick={() => {
                // 设置默认搜索条件为当前用户和股票
                const defaultSearchParams = {
                  stockCode: timeSegmentCurrentRecord?.stockCode || '',
                  account: timeSegmentCurrentRecord?.account || '',
                  templateLevel: '',
                };
                
                // 设置搜索表单的默认值
                timeSegmentTemplateSearchForm.setFieldsValue(defaultSearchParams);
                setTimeSegmentTemplateSearchParams(defaultSearchParams);
                
                // 加载档位模板，并传入默认搜索条件
                loadTimeSegmentTemplates(defaultSearchParams);
                setApplyTimeSegmentTemplateModalVisible(true);
              }}
            >
              应用档位
            </Button>
            <Button 
              type="primary"
              onClick={() => {
                timeSegmentForm.submit();
              }}
            >
              保存
            </Button>
          </div>
        </div>
        
        <Form form={timeSegmentForm} layout="vertical" onFinish={handleSaveTimeSegmentConfig}>
          <Form.Item
            label="时段配置"
            tooltip="不同时段的分时平均线买入配置，可动态增删"
            required
          >
            <Form.List name="timeSegments">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div
                      key={key}
                      style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        padding: '12px',
                        marginBottom: '8px',
                        backgroundColor: '#fafafa',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'timeSegment']}
                            label="时段开始时间"
                            rules={[
                              { required: true, message: '请输入时段开始时间' },
                              { 
                                pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                                message: '时间格式错误，请使用HH:mm格式' 
                              }
                            ]}
                            style={{ marginBottom: '0' }}
                          >
                            <Input placeholder="09:30" />
                          </Form.Item>
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <Form.Item
                            {...restField}
                            name={[name, 'maBelowPercent']}
                            label="下方百分比"
                            rules={[{ required: true, message: '请输入下方百分比' }]}
                            style={{ marginBottom: '0' }}
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
                          <Form.Item
                            {...restField}
                            name={[name, 'maAbovePercent']}
                            label="上方百分比"
                            rules={[{ required: true, message: '请输入上方百分比' }]}
                            style={{ marginBottom: '0' }}
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
                          <Form.Item
                            {...restField}
                            name={[name, 'profitPercent']}
                            label="盈利点"
                            rules={[{ required: true, message: '请输入盈利点' }]}
                            style={{ marginBottom: '0' }}
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
                            onClick={() => remove(name)}
                            size="small"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add({ timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1.0 })}
                    icon={<PlusOutlined />}
                    style={{ width: '100%' }}
                  >
                    添加时段
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
          
          <div style={{ fontSize: '12px', color: '#666', marginTop: 16 }}>
            <div><strong>配置说明：</strong></div>
            <div>
              • 时段开始时间：该时段配置的生效时间，格式为HH:mm<br/>
              • 下方%：股价低于分时平均线该百分比时买入，可为负数<br/>
              • 上方%：股价高于分时平均线该百分比时买入，可为负数<br/>
              • 盈利点：股价高于分时平均线该百分比时买入，可为负数<br/>
              • 系统会自动检查时间段重复并按时间顺序排序<br/>
              • 默认时间段：09:30(0.5%,0.1%,0.1%), 12:00(1.0%,-0.5%,-0.5%), 14:00(1.5%,-1.0%,-1.0%)
            </div>
          </div>
        </Form>
      </Modal>

      {/* 保存档位配置Modal */}
      <ModalForm
        title="保存档位配置"
        width="500px"
        formRef={saveTimeSegmentTemplateFormRef}
        modalProps={{
          destroyOnClose: true,
        }}
        open={saveTimeSegmentTemplateModalVisible}
        onOpenChange={(visible) => {
          setSaveTimeSegmentTemplateModalVisible(visible);
          if (!visible) {
            saveTimeSegmentTemplateFormRef.current?.resetFields();
            setTimeSegmentTemplateInitialValues({});
          }
        }}
        onFinish={handleSaveTimeSegmentTemplate}
        initialValues={timeSegmentTemplateInitialValues}
      >
        {/* 隐藏字段 - 策略ID */}
        <ProFormText
          name="strategyId"
          hidden
        />
        {/* 隐藏字段 - 股票代码 */}
        <ProFormText
          name="stockCode"
          hidden
        />
        {/* 隐藏字段 - 账户 */}
        <ProFormText
          name="account"
          hidden
        />
        {/* 隐藏字段 - 时段配置 */}
        <ProFormTextArea
          name="timeSegmentMaConfig"
          hidden
        />
        {/* 隐藏字段 - 配置类型 */}
        <ProFormText
          name="configType"
          hidden
        />
        
        {/* 档位等级放在最上方 */}
        <ProFormSelect
          name="templateLevel"
          label="档位等级"
          placeholder="请选择档位等级"
          options={templateLevels}
          rules={[{ required: true, message: '请选择档位等级' }]}
          fieldProps={{
            onChange: (value) => {
              // 根据选中的档位等级自动生成档位名称
              const stockCode = timeSegmentCurrentRecord?.stockCode || '';
              const accountName = timeSegmentCurrentRecord?.accountName || '';
              const templateName = `${stockCode}_${accountName}_${value}档`;
              saveTimeSegmentTemplateFormRef.current?.setFieldsValue({ templateName });
            },
          }}
        />
        <ProFormText
          name="templateName"
          label="档位名称"
          rules={[{ required: true, message: '请输入档位名称' }]}
          placeholder="请输入档位名称"
        />
        <ProFormTextArea
          name="useScenario"
          label="使用场景"
          placeholder="请输入使用场景（可选）"
          fieldProps={{
            rows: 3,
          }}
          // 移除必填规则，应用场景可以为空
        />
        <ProFormText
          name="strategyName"
          label="策略名称"
          disabled
          placeholder="策略名称"
        />
        <ProFormText
          name="stockCode"
          label="股票代码"
          disabled
          placeholder="股票代码"
        />
        <ProFormText
          name="accountName"
          label="账户名称"
          disabled
          placeholder="账户名称"
        />
      </ModalForm>

      {/* 应用时段配置档位对话框 */}
      <Modal
        title="应用时段配置档位"
        open={applyTimeSegmentTemplateModalVisible}
        onCancel={() => {
          setApplyTimeSegmentTemplateModalVisible(false);
          setSelectedTimeSegmentTemplate(undefined);
          timeSegmentTemplateSearchForm.resetFields();
          setTimeSegmentTemplateSearchParams({
            stockCode: '',
            templateLevel: '',
            account: '',
          });
        }}
        onOk={handleApplyTimeSegmentTemplate}
        width={800}
        okText="应用"
        cancelText="取消"
      >
        {/* 搜索表单 */}
        <Form
          form={timeSegmentTemplateSearchForm}
          layout="inline"
          style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}
        >
          <Form.Item name="stockCode" label="股票代码">
            <Input placeholder="请输入股票代码" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="account" label="账户">
            <Select 
              placeholder="请选择账户" 
              allowClear 
              style={{ width: 150 }}
              showSearch
              filterOption={(input, option) => {
                if (!option || !option.label) return false;
                return (option.label as string).toLowerCase().indexOf(input.toLowerCase()) >= 0;
              }}
              options={accountOptions}
            />
          </Form.Item>
          <Form.Item name="templateLevel" label="档位等级">
            <Select placeholder="请选择档位等级" allowClear style={{ width: 150 }}>
              {templateLevels.map(level => (
                <Select.Option key={level.value} value={level.value}>
                  {level.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleTimeSegmentTemplateSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleTimeSegmentTemplateSearchReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>

        <div style={{ marginBottom: 16 }}>
          <h4>选择要应用的时段配置档位：</h4>
          <Radio.Group 
            value={selectedTimeSegmentTemplate} 
            onChange={(e) => setSelectedTimeSegmentTemplate(e.target.value)}
            style={{ width: '100%' }}
          >
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {timeSegmentTemplates.map((template) => (
                <div key={template.id} style={{ 
                  padding: 12, 
                  border: '1px solid #d9d9d9', 
                  borderRadius: 4, 
                  marginBottom: 8,
                  backgroundColor: selectedTimeSegmentTemplate === template.id ? '#e6f7ff' : '#fff',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12
                }}>
                  <Radio value={template.id} style={{ marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{template.templateName}</div>
                        {template.templateLevel && (
                          <div style={{ fontSize: '12px', color: '#1890ff', marginTop: 2 }}>
                            档位等级: {template.templateLevel}
                          </div>
                        )}
                        {template.stockCode && (
                          <div style={{ fontSize: '12px', color: '#52c41a', marginTop: 2 }}>
                            股票代码: {template.stockCode}
                          </div>
                        )}
                        {template.accountName && (
                          <div style={{ fontSize: '12px', color: '#722ed1', marginTop: 2 }}>
                            账户名称: {template.accountName}
                          </div>
                        )}
                        {template.useScenario && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                            使用场景: {template.useScenario}
                          </div>
                        )}
                        
                        {/* 新增：档位配置预览 */}
                        {template.timeSegmentMaConfig && (
                          <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4, border: '1px solid #e8e8e8' }}>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#333', marginBottom: 4 }}>
                              档位配置:
                            </div>
                            {(() => {
                              try {
                                const config = parseTimeSegmentMaConfig(template.timeSegmentMaConfig);
                                if (!Array.isArray(config) || config.length === 0) {
                                  return (
                                    <div style={{ fontSize: '11px', color: '#999' }}>
                                      无有效配置
                                    </div>
                                  );
                                }
                                
                                return (
                                  <div>
                                    {config.map((item: any, index: number) => (
                                      <div key={index} style={{ 
                                        fontSize: '11px', 
                                        color: '#666', 
                                        marginBottom: 2,
                                        padding: '2px 6px',
                                        backgroundColor: '#fff',
                                        borderRadius: 2,
                                        border: '1px solid #d9d9d9'
                                      }}>
                                        <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                                          {item.timeSegment}
                                        </span>
                                        <span style={{ marginLeft: 8 }}>
                                          下方: {(item.maBelowPercent * 100).toFixed(2)}%
                                        </span>
                                        <span style={{ marginLeft: 8 }}>
                                          上方: {(item.maAbovePercent * 100).toFixed(2)}%
                                        </span>
                                        <span style={{ marginLeft: 8 }}>
                                          盈利: {((item.profitPercent || 0) * 100).toFixed(2)}%
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } catch (error) {
                                return (
                                  <div style={{ fontSize: '11px', color: '#ff4d4f' }}>
                                    配置格式错误
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        )}
                        
                      </div>
                      <Button
                        type="link"
                        danger
                        size="small"
                        onClick={() => {
                          Modal.confirm({
                            title: '确认删除',
                            content: `确定要删除档位"${template.templateName}"吗？`,
                            onOk: () => handleDeleteTimeSegmentTemplate(template.id!),
                          });
                        }}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Radio.Group>
        </div>
        {timeSegmentTemplates.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            暂无时段配置档位
            <div style={{ fontSize: '12px', marginTop: 8 }}>
              请先创建时段配置档位
            </div>
          </div>
        )}
        <div style={{ color: '#666', fontSize: '12px' }}>
          <strong>说明：</strong>选择一个时段配置档位后，将其配置应用到当前的时段配置中。注意：应用后，会覆盖原有用户股票的档位配置。
        </div>
      </Modal>
      
      {/* 批量设置买入单数Modal */}
      <ModalForm
        title="批量设置买入单数"
        width="600px"
        form={batchBuyOrderForm}
        modalProps={{
          destroyOnClose: true,
        }}
        open={batchBuyOrderModalVisible}
        onOpenChange={(visible) => {
          setBatchBuyOrderModalVisible(visible);
          if (!visible) {
            batchBuyOrderForm.resetFields();
          }
        }}
        onFinish={handleBatchSetBuyOrder}
        initialValues={{
          unsoldStackLimit: 5,
          limitStartShares: 9,
          totalFundShares: 18,
        }}
      >
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f6f6f6', borderRadius: 4 }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: 8 }}>
            将批量设置 {selectedRowKeys.length} 个选中记录的买入单数配置
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            注意：只有填写的字段才会被更新，空白字段将保持原值不变
          </div>
        </div>

        <ProFormDigit
          name="unsoldStackLimit"
          label="未卖出堆栈值"
          placeholder="请输入未卖出堆栈值"
          min={1}
          precision={0}
          fieldProps={{
            style: { width: '100%' }
          }}
          extra="限制当天同一股票在同一策略下最多允许的未卖出买入订单数（必须为正数）"
        />

        <ProFormDigit
          name="limitStartShares"
          label="限制开始份数"
          placeholder="请输入限制开始份数"
          min={1}
          precision={0}
          fieldProps={{
            style: { width: '100%' }
          }}
          extra="从第几份开始限制买入，默认为9（必须为正数）"
        />

        <ProFormDigit
          name="totalFundShares"
          label="最大持有买入单数"
          placeholder="请输入最大持有买入单数"
          min={1}
          precision={0}
          fieldProps={{
            style: { width: '100%' }
          }}
          extra="资金分成多少份用于买入，默认18份（必须为正数）"
        />

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4, border: '1px solid #ffd591' }}>
          <div style={{ fontSize: '12px', color: '#d48806' }}>
            <strong>配置说明：</strong><br/>
            • 未卖出堆栈值：控制同一股票未卖出的买入订单数量上限<br/>
            • 限制开始份数：从第几份开始应用买入限制策略<br/>
            • 最大持有买入单数：将资金分割成多少份进行分批买入<br/>
            • 这些参数共同控制买入单数的分配和风险控制
          </div>
        </div>
      </ModalForm>
    </>
  );
});

export default StrategyUserStockList; 