import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState, useMemo } from 'react';
import { Button, message, Popconfirm, Space, Tag, Tooltip, Switch, Select, DatePicker, Modal, Checkbox, Dropdown, Menu, InputNumber, Input, Card, Statistic, Row, Col, Form, Typography, Divider, Badge, Radio, Table, Alert, Descriptions } from 'antd';
import {
  ActionType,
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
  ProColumns,
  ProFormDateTimePicker,
  ProFormSwitch,
  ProFormRadio,
  ProFormCheckbox,
  ProFormTimePicker,
  ProFormDependency,
} from '@ant-design/pro-components';
import { PlusOutlined, DownOutlined, UpOutlined, SettingOutlined, ThunderboltOutlined, ExclamationCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SyncOutlined, FilterOutlined, EyeOutlined, EyeInvisibleOutlined, ClockCircleOutlined, InfoCircleOutlined, QuestionCircleOutlined, SearchOutlined, ReloadOutlined, DollarOutlined } from '@ant-design/icons';
import { getConfigTemplateList, saveConfigTemplate, deleteConfigTemplate, applyConfigTemplate, listStrategyStock, createStrategyStock, updateStrategyStock, deleteStrategyStock, updateStrategyStockStatus, updateStrategyStockOpeningBuy, updateStrategyStockProfitSellBeforeClose, batchUpdateStrategyStockOpeningBuy, batchUpdateStrategyStockProfitSellBeforeClose, listStrategyJob, listStrategyUserStock, batchUpdateStrategyUserStockTimeSegmentConfig, batchUpdateStrategyStockStatus, listAccountInfo, getAccountConfigStatus, getConfigTemplateById, listTimeSegmentTemplates, createTimeSegmentTemplate, getTimeSegmentTemplateById, deleteTimeSegmentTemplate, getTimeSegmentTemplateLevels, listTimeSegmentTemplatesByLevel, applyTimeSegmentTemplateToStrategyStock, batchUpdateStrategyStockTimeSegmentConfig, batchSwitchStrategyStockTemplateLevel, batchImmediateBuyStrategyStock, updateStrategyStockYesterdayLowestBuy, batchUpdateStrategyStockYesterdayLowestBuy } from '@/services/ant-design-pro/api';
import { useModel } from '@umijs/max';
import { history } from '@umijs/max';
import { FormattedMessage, useIntl } from '@umijs/max';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';

const { Option } = Select;

// 收盘前盈利卖出枚举值映射
const PROFIT_SELL_BEFORE_CLOSE_ENUM = {
  PROFIT_SELL_BEFORE_CLOSE: '收盘前总盈利卖出',
  ALL_SELL_BEFORE_CLOSE: '收盘前全部卖出',
  NO_SELL: '不卖出',
};

// 收盘前盈利卖出枚举值反向映射
const PROFIT_SELL_BEFORE_CLOSE_REVERSE_ENUM = {
  '收盘前总盈利卖出': 'PROFIT_SELL_BEFORE_CLOSE',
  '收盘前全部卖出': 'ALL_SELL_BEFORE_CLOSE',
  '不卖出': 'NO_SELL',
};

interface StrategyStockListProps {
  strategyId?: number;
  strategyName?: string;
  onClearStrategy?: () => void;
  editStockCode?: string;
  onEditComplete?: () => void;
  onJumpToUserStock?: (strategyId: number, stockCode: string, accountInfo?: any) => void;
  openTimeSegmentConfig?: boolean;
  onTimeSegmentConfigComplete?: () => void;
}

/**
 * 策略股票关系列表组件
 */
const StrategyStockList = forwardRef((props: StrategyStockListProps, ref) => {
  const { strategyId, strategyName, onClearStrategy, editStockCode, onEditComplete, onJumpToUserStock, openTimeSegmentConfig, onTimeSegmentConfigComplete } = props;
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.StrategyStockItem>();
  const [strategyOptions, setStrategyOptions] = useState<{label: string, value: number}[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [saveTemplateModalVisible, setSaveTemplateModalVisible] = useState<boolean>(false);
  const [applyTemplateModalVisible, setApplyTemplateModalVisible] = useState<boolean>(false);
  const [templates, setTemplates] = useState<API.StrategyConfigTemplateItem[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<number>();
  const [templateInitialValues, setTemplateInitialValues] = useState<any>({});
  const [currentTableData, setCurrentTableData] = useState<API.StrategyStockItem[]>([]);
  // 批量切换档位相关状态
  const [batchSwitchTemplateLevelModalVisible, setBatchSwitchTemplateLevelModalVisible] = useState<boolean>(false);
  const [selectedBatchTemplateLevel, setSelectedBatchTemplateLevel] = useState<string>('');
  const [batchSwitchResultDetailModalVisible, setBatchSwitchResultDetailModalVisible] = useState<boolean>(false);
  const [batchSwitchExecutionResult, setBatchSwitchExecutionResult] = useState<API.TemplateLevelApplyResult | null>(null);
  const actionRef = useRef<ActionType>();
  const createFormRef = useRef<any>();
  const updateFormRef = useRef<any>();
  const saveTemplateFormRef = useRef<any>();
  const intl = useIntl();
  
  const [createForm] = Form.useForm();
  const [updateForm] = Form.useForm();

  // 公开刷新方法
  useImperativeHandle(ref, () => ({
    reload: () => {
      actionRef.current?.reload();
    },
  }));

  // 加载策略任务列表
  useEffect(() => {
    const fetchStrategyOptions = async () => {
      try {
        const res = await listStrategyJob({
          current: 1,
          pageSize: 100,
        });
        if (res && res.data) {
          const options = res.data.map((item: any) => ({
            label: item.name,
            value: item.id,
          }));
          setStrategyOptions(options);
        }
      } catch (error) {
        console.error('获取策略任务列表失败:', error);
      }
    };
    
    fetchStrategyOptions();
    
    // 如果有策略ID，加载相关数据
    if (strategyId) {
      loadTimeSegmentTemplateLevelMap();
    }
  }, [strategyId]);

  // 监听openTimeSegmentConfig变化，自动打开时段配置对话框
  useEffect(() => {
    if (openTimeSegmentConfig && strategyId && editStockCode) {
      // 延迟执行，等待表格数据加载完成
      const timer = setTimeout(async () => {
        try {
          // 获取策略股票列表
          const response = await listStrategyStock({
            current: 1,
            pageSize: 1000,
            strategyId: strategyId,
            stockCode: editStockCode,
          });
          
          if (response && response.data && response.data.length > 0) {
            const targetRecord = response.data[0];
            // 直接打开时段配置对话框
            handleTimeSegmentConfig(targetRecord);
          } else {
            message.warning(`未找到策略下的股票 ${editStockCode} 的配置，请先在策略标的中添加该股票`);
          }
        } catch (error) {
          console.error('自动打开时段配置对话框失败:', error);
          message.error('自动打开时段配置对话框失败');
        } finally {
          // 通知父组件完成
          if (onTimeSegmentConfigComplete) {
            onTimeSegmentConfigComplete();
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [openTimeSegmentConfig, strategyId, editStockCode, onTimeSegmentConfigComplete]);

  // 默认买入比例配置
  const defaultFirstShareRatio = 3; // 默认前N档买入比例3%
  const defaultExtraShares = [
    { drop: 7, ratio: 3, secondStage: false },
    { drop: 7, ratio: 3, secondStage: false },
    { drop: 9, ratio: 4.6, secondStage: false },
    { drop: 9, ratio: 4.6, secondStage: false },
    { drop: 9, ratio: 4.6, secondStage: false },
    { drop: 11, ratio: 6, secondStage: true }, // 只有第6档默认启用二阶段策略
    { drop: 11, ratio: 7.7, secondStage: false },
  ];

  // 默认时段分时平均线配置
  const defaultTimeSegmentMaConfig: Array<{
    timeSegment: string;
    maBelowPercent: number;
    maAbovePercent: number;
    profitPercent: number;
  }> = [];

  // 解析buyRatioConfig字符串
  const parseBuyRatioConfig = (configString: string | undefined) => {
    if (!configString) {
      return {
        firstShareRatio: defaultFirstShareRatio,
        extraShares: defaultExtraShares
      };
    }

    try {
      const config = JSON.parse(configString);
      console.log('解析的原始config:', JSON.stringify(config));
      
      // 解析extraShares，确保secondStage属性正确
      const processedExtraShares = Array.isArray(config.extraShares) && config.extraShares.length > 0 
        ? config.extraShares.map((share: any) => ({
            ...share,
            // 确保每个share都有secondStage属性，如果没有则默认为false
            secondStage: share.secondStage === true
          })) 
        : [...defaultExtraShares]; // 使用默认值的复制，避免修改默认值
      
      // 确保只有一个档位启用二阶段策略
      let hasSecondStage = false;
      processedExtraShares.forEach((share: any) => {
        if (share.secondStage) {
          if (hasSecondStage) {
            share.secondStage = false;
          } else {
            hasSecondStage = true;
          }
        }
      });
      
      return {
        firstShareRatio: config.firstShareRatio ?? defaultFirstShareRatio,
        extraShares: processedExtraShares
      };
    } catch (error) {
      console.error('解析buyRatioConfig失败:', error);
      return {
        firstShareRatio: defaultFirstShareRatio,
        extraShares: defaultExtraShares
      };
    }
  };

  // 解析timeSegmentMaConfig字符串
  const parseTimeSegmentMaConfig = (configString: string | undefined) => {
    if (!configString) {
      return [...defaultTimeSegmentMaConfig]; // 返回默认配置的复制
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
      return [...defaultTimeSegmentMaConfig];
    } catch (error) {
      console.error('解析timeSegmentMaConfig失败:', error);
      return [...defaultTimeSegmentMaConfig];
    }
  };

  // 添加策略股票关系
  const handleAdd = async (fields: any) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.creating' }));
    
    // 如果有选择策略，则使用选定的策略ID和名称
    if (strategyId) {
      fields.strategyId = strategyId;
      fields.strategyName = strategyName;
    }
    
    // 将百分比值转换为小数
    if (fields.profitRatio) {
      fields.profitRatio = fields.profitRatio / 100;
    }
    if (fields.maBelowPercent) {
      fields.maBelowPercent = fields.maBelowPercent / 100;
    }
    if (fields.maAbovePercent) {
      fields.maAbovePercent = fields.maAbovePercent / 100;
    }
    if (fields.levelPercent) {
      fields.levelPercent = fields.levelPercent / 100;
    }
    if (fields.intraUpPullbackPercent) {
      fields.intraUpPullbackPercent = fields.intraUpPullbackPercent / 100;
    }
    if (fields.intraDnBelowAvgPercent) {
      fields.intraDnBelowAvgPercent = fields.intraDnBelowAvgPercent / 100;
    }
    
    // 确保有默认值
    fields.unsoldStackLimit = fields.unsoldStackLimit || 4;
    fields.totalFundShares = fields.totalFundShares || 18;
    fields.limitStartShares = fields.limitStartShares || 9;
    
    // 获取表单原始数据，处理buyRatioConfig
    const formValues = createFormRef.current?.getFieldsValue();
    console.log('新建表单提交前的数据:', JSON.stringify(formValues?.buyRatioConfigInput));
    if (formValues?.buyRatioConfigInput) {
      const { firstShareRatio, extraShares } = formValues.buyRatioConfigInput;
      
      // 确保每个extraShare都有正确的secondStage值
      const processedExtraShares = extraShares.map((share: any) => ({
        ...share,
        secondStage: !!share.secondStage // 强制转换为布尔值
      }));
      
      // 确保只有一个档位启用二阶段策略
      let hasSecondStage = false;
      processedExtraShares.forEach((share: any) => {
        if (share.secondStage) {
          if (hasSecondStage) {
            share.secondStage = false;
          } else {
            hasSecondStage = true;
          }
        }
      });
      
      fields.buyRatioConfig = JSON.stringify({ 
        firstShareRatio, 
        extraShares: processedExtraShares 
      });
      console.log('处理后的buyRatioConfig:', fields.buyRatioConfig);
    }
    
    // 处理买入比例配置
    const buyRatioConfig = parseBuyRatioConfig(fields.buyRatioConfig);
    fields.buyRatioConfig = JSON.stringify(buyRatioConfig);
    
    try {
      await createStrategyStock(fields);
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

  // 更新策略股票关系
  const handleUpdate = async (fields: any) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.updating' }));
    
    if (!currentRow) {
      return false;
    }
    
    // 将百分比值转换为小数
    if (fields.profitRatio) {
      fields.profitRatio = fields.profitRatio / 100;
    }
    if (fields.maBelowPercent) {
      fields.maBelowPercent = fields.maBelowPercent / 100;
    }
    if (fields.maAbovePercent) {
      fields.maAbovePercent = fields.maAbovePercent / 100;
    }
    if (fields.levelPercent) {
      fields.levelPercent = fields.levelPercent / 100;
    }
    if (fields.intraUpPullbackPercent) {
      fields.intraUpPullbackPercent = fields.intraUpPullbackPercent / 100;
    }
    if (fields.intraDnBelowAvgPercent) {
      fields.intraDnBelowAvgPercent = fields.intraDnBelowAvgPercent / 100;
    }
    
    // 确保有默认值
    fields.unsoldStackLimit = fields.unsoldStackLimit || currentRow.unsoldStackLimit || 4;
    fields.totalFundShares = fields.totalFundShares || currentRow.totalFundShares || 18;
    fields.limitStartShares = fields.limitStartShares || currentRow.limitStartShares || 9;
    
    // 获取表单原始数据，处理buyRatioConfig
    const formValues = updateFormRef.current?.getFieldsValue();
    console.log('编辑表单提交前的数据:', JSON.stringify(formValues?.buyRatioConfigInput));
    if (formValues?.buyRatioConfigInput) {
      const { firstShareRatio, extraShares } = formValues.buyRatioConfigInput;
      
      // 确保每个extraShare都有正确的secondStage值
      const processedExtraShares = extraShares.map((share: any) => ({
        ...share,
        secondStage: !!share.secondStage // 强制转换为布尔值
      }));
      
      // 确保只有一个档位启用二阶段策略
      let hasSecondStage = false;
      processedExtraShares.forEach((share: any) => {
        if (share.secondStage) {
          if (hasSecondStage) {
            share.secondStage = false;
          } else {
            hasSecondStage = true;
          }
        }
      });
      
      fields.buyRatioConfig = JSON.stringify({ 
        firstShareRatio, 
        extraShares: processedExtraShares 
      });
      console.log('处理后的buyRatioConfig:', fields.buyRatioConfig);
    }
    
    // 处理买入比例配置
    const buyRatioConfig = parseBuyRatioConfig(fields.buyRatioConfig);
    fields.buyRatioConfig = JSON.stringify(buyRatioConfig);
    
    try {
      await updateStrategyStock({
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

  // 删除策略股票关系
  const handleDelete = async (record: API.StrategyStockItem) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.deleting' }));
    
    try {
      await deleteStrategyStock(record);
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

  // 更新策略股票关系状态
  const handleUpdateStatus = async (id: number, status: string) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.updating' }));
    
    try {
      await updateStrategyStockStatus({ id, status });
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

  // 更新策略股票关系开盘买入状态
  const handleUpdateOpeningBuy = async (id: number, enableOpeningBuy: boolean) => {
    const hide = message.loading('更新中...');
    
    try {
      await updateStrategyStockOpeningBuy({ id, enableOpeningBuy });
      hide();
      message.success('更新成功');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('更新失败');
      return false;
    }
  };

  // 更新策略股票关系收盘前盈利卖出状态
  const handleUpdateProfitSellBeforeClose = async (id: number, enableProfitSellBeforeClose: string) => {
    const hide = message.loading('更新中...');
    
    try {
      await updateStrategyStockProfitSellBeforeClose({ id, enableProfitSellBeforeClose });
      hide();
      message.success('更新成功');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('更新失败');
      return false;
    }
  };

  // 更新策略股票关系昨天最低价买入状态
  const handleUpdateYesterdayLowestBuy = async (id: number, enableYesterdayLowestBuy: boolean) => {
    const hide = message.loading('更新中...');
    
    try {
      await updateStrategyStockYesterdayLowestBuy({ id, enableYesterdayLowestBuy });
      hide();
      message.success('更新成功');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('更新失败');
      return false;
    }
  };

  // 批量更新策略股票关系开盘买入状态
  const handleBatchUpdateOpeningBuy = async (enableOpeningBuy: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    const hide = message.loading('批量更新中...');
    
    try {
      const result = await batchUpdateStrategyStockOpeningBuy({ 
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

  // 加载模版列表
  const loadTemplates = async () => {
    try {
      const response = await getConfigTemplateList({ configType: 'strategy_stock' });
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
      const response = await getConfigTemplateList({ configType: 'strategy_stock' });
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
        configType: 'strategy_stock',
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
        configType: 'strategy_stock',
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
  const handleSaveAsTemplate = (record: API.StrategyStockItem) => {
    // 设置模版初始值
    const initialValues = {
      strategyId: record.strategyId,
      sourceStockCode: record.stockCode,
      name: `${record.stockCode}_策略标的_模版`,
    };
    setTemplateInitialValues(initialValues);
    setSaveTemplateModalVisible(true);
    // 临时设置选中的行，用于保存模版
    setSelectedRowKeys([record.id!]);
  };

  // 表格列定义
  const columns: ProColumns<API.StrategyStockItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInSearch: true,
      width: 60,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.strategy.job.name" defaultMessage="Strategy" />,
      dataIndex: 'strategyName',
      valueType: 'select',
      fieldProps: {
        options: strategyOptions,
      },
      renderFormItem: (_, { type, defaultRender }) => {
        if (type === 'form') {
          return null;
        }
        return defaultRender(_);
      },
      formItemProps: {
        name: 'strategyId',
      },
      hideInTable: !!strategyId, // 如果已经选择了策略，隐藏该列
      width: 100,
    },
    {
      title: <FormattedMessage id="pages.strategy.stock.relation.stockCode" defaultMessage="Stock Code" />,
      dataIndex: 'stockCode',
      copyable: true,
      sorter: true,
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
      valueEnum: {
        '小盘股': { text: '小盘股', status: 'Default' },
        '中盘股': { text: '中盘股', status: 'Processing' },
        '大盘股': { text: '大盘股', status: 'Success' },
        'ETF': { text: 'ETF', status: 'Warning' },
      },
      render: (_, record) => {
        const colorMap = {
          '小盘股': 'default',
          '中盘股': 'processing',
          '大盘股': 'success',
          'ETF': 'warning',
        };
        return record.marketCapScale ? (
          <Tag color={colorMap[record.marketCapScale as keyof typeof colorMap] || 'default'}>
            {record.marketCapScale}
          </Tag>
        ) : '-';
      },
    },
    {
      title: (
        <>
          <>时段分时配置</>
          <Tooltip title="不同时段的分时平均线买入配置和盈利点">
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
        
        if (!record.timeSegmentMaConfig) {
          return (
            <div>
              <Tag color="default">未配置</Tag>
              {levelText && <Tag color="purple" style={{ marginTop: 2 }}>档位: {levelText}</Tag>}
            </div>
          );
        }
        
        try {
          const config = JSON.parse(record.timeSegmentMaConfig);
          if (!Array.isArray(config) || config.length === 0) {
            return (
              <div>
                <Tag color="default">未配置</Tag>
                {levelText && <Tag color="purple" style={{ marginTop: 2 }}>档位: {levelText}</Tag>}
              </div>
            );
          }
          
          return (
            <div>
              {config.map((item: any, index: number) => (
                <Tag key={index} color="blue" style={{ marginBottom: 2 }}>
                  {item.timeSegment}: 分时下方{(item.maBelowPercent * 100).toFixed(2)}%/分时上方{(item.maAbovePercent * 100).toFixed(2)}%/盈利点{((item.profitPercent || 0) * 100).toFixed(2)}%
                </Tag>
              ))}
              {levelText && <Tag color="purple" style={{ marginTop: 2 }}>档位: {levelText}</Tag>}
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
        <>
          <FormattedMessage id="pages.strategy.stock.relation.maBelowPercent" defaultMessage="MA Below Percent" />
          <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercentTip" defaultMessage="Buy when price is below moving average by this percentage" />}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'maBelowPercent',
      valueType: 'digit',
      hideInSearch: true,
      hideInTable: true,
      render: (_, record) => record.maBelowPercent ? `${(record.maBelowPercent * 100).toFixed(1)}%` : '-',
    },
    {
      title: (
        <>
          <FormattedMessage id="pages.strategy.stock.relation.maAbovePercent" defaultMessage="MA Above Percent" />
          <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercentTip" defaultMessage="Buy when price is above moving average by this percentage" />}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'maAbovePercent',
      valueType: 'digit',
      hideInSearch: true,
      hideInTable: true,
      render: (_, record) => record.maAbovePercent ? `${(record.maAbovePercent * 100).toFixed(1)}%` : '-',
    },
    {
      title: (
        <>
          <FormattedMessage id="pages.strategy.stock.relation.levelPercent" defaultMessage="Level Percent" />
          <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.levelPercentTip" defaultMessage="Level percentage for stock trading" />}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'levelPercent',
      valueType: 'digit',
      hideInSearch: true,
      render: (_, record) => record.levelPercent ? `${(record.levelPercent * 100).toFixed(1)}%` : '-',
    },
    {
      title: (
        <>
          <>日内持续上涨并高位回调百分比(%)</>
          <Tooltip title="当股票日内持续上涨后从高点回调该百分比时触发买入信号（如3表示3%）">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'intraUpPullbackPercent',
      valueType: 'digit',
      hideInSearch: true,
      hideInTable: true,
      render: (_, record) => record.intraUpPullbackPercent ? `${(record.intraUpPullbackPercent * 100).toFixed(1)}%` : '-',
    },
    {
      title: (
        <>
          <>日内持续下跌并低于分时均价百分比(%)</>
          <Tooltip title="当股票日内持续下跌且低于分时均价该百分比时触发买入信号（如1表示1%）">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'intraDnBelowAvgPercent',
      valueType: 'digit',
      hideInSearch: true,
      hideInTable: true,
      render: (_, record) => record.intraDnBelowAvgPercent ? `${(record.intraDnBelowAvgPercent * 100).toFixed(1)}%` : '-',
    },
    {
      title: (
        <>
          <>是否开盘买入</>
          <Tooltip title="是否在开盘时执行买入策略，默认开启">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'enableOpeningBuy',
      valueType: 'switch',
      hideInSearch: true,
      render: (_, record) => (
        <Switch
          checkedChildren="是"
          unCheckedChildren="否"
          checked={record.enableOpeningBuy !== false} // 默认为true，只有明确设置为false时才显示否
          onChange={(checked) => {
            handleUpdateOpeningBuy(record.id!, checked);
          }}
        />
      ),
    },
    {
      title: (
        <>
          <>收盘前盈利卖出</>
          <Tooltip title="收盘前盈利卖出策略：收盘前总盈利卖出、收盘前全部卖出、不卖出">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'enableProfitSellBeforeClose',
      hideInSearch: true,
      render: (_, record) => {
        const getNextValue = (current: string | undefined): string => {
          if (current === 'PROFIT_SELL_BEFORE_CLOSE') {
            return 'ALL_SELL_BEFORE_CLOSE';
          }
          if (current === 'ALL_SELL_BEFORE_CLOSE') {
            return 'NO_SELL';
          }
          return 'PROFIT_SELL_BEFORE_CLOSE'; // 默认或"NO_SELL"时切换到默认值
        };
        
        const getDisplayText = (value: string | undefined): string => {
          return PROFIT_SELL_BEFORE_CLOSE_ENUM[value as keyof typeof PROFIT_SELL_BEFORE_CLOSE_ENUM] || '收盘前总盈利卖出';
        };
        
        const getColor = (value: string | undefined): string => {
          if (value === 'PROFIT_SELL_BEFORE_CLOSE') return '#52c41a';
          if (value === 'ALL_SELL_BEFORE_CLOSE') return '#faad14';
          if (value === 'NO_SELL') return '#ff4d4f';
          return '#52c41a'; // 默认颜色
        };
        
        return (
          <Tag
            color={getColor(record.enableProfitSellBeforeClose)}
            style={{ cursor: 'pointer' }}
            onClick={async () => {
              const currentValue = record.enableProfitSellBeforeClose;
              const nextValue = getNextValue(currentValue);
              
              try {
                await handleUpdateProfitSellBeforeClose(record.id!, nextValue);
              } catch (error) {
                console.error('更新收盘前盈利卖出状态失败:', error);
              }
            }}
          >
            {getDisplayText(record.enableProfitSellBeforeClose)}
          </Tag>
        );
      },
    },
    {
      title: (
        <>
          <>昨天最低价买入</>
          <Tooltip title="是否在股票价格接近昨天最低价时触发买入信号">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'enableYesterdayLowestBuy',
      valueType: 'switch',
      hideInSearch: true,
      render: (_, record) => (
        <Switch
          checkedChildren="是"
          unCheckedChildren="否"
          checked={record.enableYesterdayLowestBuy === true}
          onChange={(checked) => {
            handleUpdateYesterdayLowestBuy(record.id!, checked);
          }}
        />
      ),
    },
    {
      title: <FormattedMessage id="pages.strategy.stock.relation.status" defaultMessage="Status" />,
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
            if (editItem.profitRatio !== undefined) {
              editItem.profitRatio = editItem.profitRatio * 100;
            }
            if (editItem.maBelowPercent !== undefined) {
              editItem.maBelowPercent = editItem.maBelowPercent * 100;
            }
            if (editItem.maAbovePercent !== undefined) {
              editItem.maAbovePercent = editItem.maAbovePercent * 100;
            }
            if (editItem.levelPercent !== undefined) {
              editItem.levelPercent = editItem.levelPercent * 100;
            }
            if (editItem.intraUpPullbackPercent !== undefined) {
              editItem.intraUpPullbackPercent = editItem.intraUpPullbackPercent * 100;
            }
            if (editItem.intraDnBelowAvgPercent !== undefined) {
              editItem.intraDnBelowAvgPercent = editItem.intraDnBelowAvgPercent * 100;
            }
            
            // 确保默认值
            if (editItem.unsoldStackLimit === undefined) {
              editItem.unsoldStackLimit = 4; // 默认值
            }
            if (editItem.totalFundShares === undefined) {
              editItem.totalFundShares = 18; // 默认值
            }
            if (editItem.limitStartShares === undefined) {
              editItem.limitStartShares = 9; // 默认值
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
        <a
          key="timeSegmentConfig"
          onClick={() => handleTimeSegmentConfig(record)}
        >
          时段配置
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
        </Popconfirm>,
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
  
  // 新增状态：账户信息和展开行的配置状态
  const [accountOptions, setAccountOptions] = useState<{label: string, value: string, accountInfo: any}[]>([]);
  const [expandedRowConfigs, setExpandedRowConfigs] = useState<Record<string, API.AccountConfigStatusVO[]>>({});

  // 加载账户列表
  useEffect(() => {
    const fetchAccountOptions = async () => {
      try {
        const res = await listAccountInfo({
          current: 1,
          pageSize: 1000,
          enable: true, // 只获取启用的账户
        }, {});
        if (res && res.data) {
          const options = res.data.map((item: any) => ({
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
    
    fetchAccountOptions();
  }, []);

  // 加载展开行配置数据
  const loadExpandedRowConfig = async (strategyId: number, stockCode: string) => {
    const key = `${strategyId}-${stockCode}`;
    
    try {
      const response = await getAccountConfigStatus({ strategyId, stockCode });
      if (response.success) {
        setExpandedRowConfigs(prev => ({
          ...prev,
          [key]: response.data
        }));
      }
    } catch (error) {
      console.error('加载配置数据失败:', error);
      message.error('加载配置数据失败');
    }
  };

  // 渲染展开行内容
  const renderExpandedRow = (record: API.StrategyStockItem) => {
    const key = `${record.strategyId}-${record.stockCode}`;
    const configData = expandedRowConfigs[key] || [];

    const columns = [
      {
        title: '账户',
        dataIndex: 'account',
        key: 'account',
        width: 120,
      },
      {
        title: '别名',
        dataIndex: 'accountName',
        key: 'accountName',
        width: 120,
      },
      {
        title: '配置状态',
        dataIndex: 'configured',
        key: 'configured',
        width: 100,
        render: (configured: boolean) => (
          <Tag color={configured ? 'green' : 'red'}>
            {configured ? '已配置' : '未配置'}
          </Tag>
        ),
      },
      {
        title: '操作',
        key: 'action',
        width: 100,
        render: (_: any, accountRecord: API.AccountConfigStatusVO) => (
          !accountRecord.configured ? (
            <Button
              type="primary"
              size="small"
              onClick={() => onJumpToUserStock?.(record.strategyId!, record.stockCode!, accountRecord)}
            >
              配置
            </Button>
          ) : null
        ),
      },
    ];

    return (
      <div style={{ padding: '0 24px' }}>
        <Table
          columns={columns}
          dataSource={configData}
          pagination={false}
          size="small"
          rowKey="accountId"
        />
      </div>
    );
  };
  
  // 时段配置对话框相关状态
  const [timeSegmentModalVisible, setTimeSegmentModalVisible] = useState<boolean>(false);
  const [timeSegmentCurrentRecord, setTimeSegmentCurrentRecord] = useState<API.StrategyStockItem | null>(null);
  const [timeSegmentForm] = Form.useForm();
  
  // 新增：多账号应用相关状态
  const [timeSegmentSelectedAccounts, setTimeSegmentSelectedAccounts] = useState<string[]>([]);
  const [timeSegmentAllAccounts, setTimeSegmentAllAccounts] = useState<{account: string, name: string}[]>([]);
  const [timeSegmentSelectAll, setTimeSegmentSelectAll] = useState<boolean>(false);

  // 新增：时段配置档位相关状态
  const [timeSegmentTemplateModalVisible, setTimeSegmentTemplateModalVisible] = useState<boolean>(false);
  const [timeSegmentApplyTemplateModalVisible, setTimeSegmentApplyTemplateModalVisible] = useState<boolean>(false);
  const [timeSegmentTemplates, setTimeSegmentTemplates] = useState<any[]>([]);
  const [selectedTimeSegmentTemplate, setSelectedTimeSegmentTemplate] = useState<number>();
  const [timeSegmentTemplateForm] = Form.useForm();
  const timeSegmentTemplateFormRef = useRef<any>();
  const [timeSegmentTemplateLevels, setTimeSegmentTemplateLevels] = useState<{value: string, label: string}[]>([]);
  const [timeSegmentTemplateSearchForm] = Form.useForm();
  const [timeSegmentTemplateSearchParams, setTimeSegmentTemplateSearchParams] = useState<any>({
    stockCode: '',
    templateLevel: '',
  });

  // 档位等级映射状态
  const [timeSegmentTemplateLevelMap, setTimeSegmentTemplateLevelMap] = useState<Map<number, string>>(new Map());
  
  // 加载时段配置档位列表
  const loadTimeSegmentTemplates = async (searchParams?: any) => {
    try {
      const searchConditions = {
        configType: 'STOCK',
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

  // 加载档位等级选项
  const loadTimeSegmentTemplateLevels = async () => {
    try {
      const response = await getTimeSegmentTemplateLevels();
      if (response.success && response.data) {
        setTimeSegmentTemplateLevels(response.data);
      }
    } catch (error) {
      console.error('加载档位等级选项失败:', error);
    }
  };

  // 加载档位等级映射
  const loadTimeSegmentTemplateLevelMap = async () => {
    try {
      const response = await listTimeSegmentTemplates({
        configType: 'STOCK',
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

  // 保存时段配置为档位
  const handleSaveTimeSegmentAsTemplate = async (values: any) => {
    if (!timeSegmentCurrentRecord) {
      message.error('当前记录不存在');
      return false;
    }

    // 验证表单数据
    const timeSegmentFormValues = timeSegmentForm.getFieldsValue();
    const { timeSegmentMaConfigInput } = timeSegmentFormValues;
    
    if (!timeSegmentMaConfigInput || timeSegmentMaConfigInput.length === 0) {
      message.error('请先配置时段数据');
      return false;
    }

    // 构建时段配置数据
    const sortedConfig = timeSegmentMaConfigInput
      .sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment))
      .map((item: any) => ({
        timeSegment: item.timeSegment,
        maBelowPercent: item.maBelowPercent / 100,
        maAbovePercent: item.maAbovePercent / 100,
        profitPercent: item.profitPercent / 100,
      }));

    // 构建档位数据
    const templateData: API.TimeSegmentTemplateItem = {
      templateName: values.templateName,
      templateLevel: values.templateLevel,
      useScenario: values.useScenario,
      strategyId: timeSegmentCurrentRecord.strategyId,
      strategyName: timeSegmentCurrentRecord.strategyName,
      stockCode: timeSegmentCurrentRecord.stockCode,
      timeSegmentMaConfig: JSON.stringify(sortedConfig),
      configType: 'STOCK',
    };

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
              setTimeSegmentTemplateModalVisible(false);
              timeSegmentTemplateForm.resetFields();
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
        message.success('时段配置档位保存成功');
        setTimeSegmentTemplateModalVisible(false);
        timeSegmentTemplateForm.resetFields();
        return true;
      } else {
        console.log('保存档位配置 - 检查错误码:', response.errorCode, '类型:', typeof response.errorCode);
        
        // 使用更宽松的错误码比较
        if (response.errorCode === '409' || String(response.errorCode) === '409') {
          handle409Error(response);
          return false;
        } else {
          message.error('时段配置档位保存失败: ' + (response.errorMessage || response.message));
          return false;
        }
      }
    } catch (error: any) {
      console.error('时段配置档位保存失败 - catch块:', error);
      
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
      message.error('时段配置档位保存失败');
      return false;
    }
  };

  // 应用时段配置档位
  const handleApplyTimeSegmentTemplate = async () => {
    if (!selectedTimeSegmentTemplate) {
      message.error('请选择要应用的时段配置档位');
      return;
    }

    if (!timeSegmentCurrentRecord) {
      message.error('当前记录不存在');
      return;
    }

    const hide = message.loading('应用时段配置档位中...');
    try {
      // 获取档位详情
      const templateResponse = await getTimeSegmentTemplateById(selectedTimeSegmentTemplate);
      if (!templateResponse.success || !templateResponse.data) {
        message.error('获取档位数据失败');
        return;
      }

      const template = templateResponse.data;
      if (!template.timeSegmentMaConfig) {
        message.error('档位配置数据为空');
        return;
      }

      // 应用档位配置到策略标的
      const applyResponse = await applyTimeSegmentTemplateToStrategyStock({
        templateId: selectedTimeSegmentTemplate,
        strategyStockIds: [timeSegmentCurrentRecord.id!],
      });
      
      if (applyResponse.success) {
        // 转换为表单格式（百分比显示）
        const timeSegmentConfig = JSON.parse(template.timeSegmentMaConfig);
        const formattedConfig = timeSegmentConfig.map((item: any) => ({
          timeSegment: item.timeSegment,
          maBelowPercent: item.maBelowPercent * 100,
          maAbovePercent: item.maAbovePercent * 100,
          profitPercent: item.profitPercent * 100,
        }));

        // 应用到表单
        timeSegmentForm.setFieldsValue({
          timeSegmentMaConfigInput: formattedConfig,
        });

        hide();
        message.success('时段配置档位应用成功');
        
        // 关闭应用档位对话框
        setTimeSegmentApplyTemplateModalVisible(false);
        setSelectedTimeSegmentTemplate(undefined);
        timeSegmentTemplateSearchForm.resetFields();
        setTimeSegmentTemplateSearchParams({
          stockCode: '',
          templateLevel: '',
        });
        
        // 重新加载档位等级映射
        await loadTimeSegmentTemplateLevelMap();
      } else {
        hide();
        message.error('应用时段配置档位失败');
      }
    } catch (error) {
      hide();
      message.error('应用时段配置档位失败');
    }
  };

  // 删除时段配置档位
  const handleDeleteTimeSegmentTemplate = async (id: number) => {
    const hide = message.loading('删除中...');
    try {
      await deleteTimeSegmentTemplate(id);
      hide();
      message.success('时段配置档位删除成功');
      loadTimeSegmentTemplates();
    } catch (error: any) {
      hide();
      const errorMessage = error?.response?.data?.message || error?.message || '时段配置档位删除失败';
      message.error({
        content: errorMessage,
        duration: 6,
        style: {
          whiteSpace: 'pre-line',
        },
      });
    }
  };

  // 处理时段配置
  const handleTimeSegmentConfig = (record: API.StrategyStockItem) => {
    setTimeSegmentCurrentRecord(record);
    
    // 获取该股票相关的所有账户信息
    const fetchAccountsForStock = async () => {
      try {
        // 查询使用该策略股票的所有账户
        const userStockRes = await listStrategyUserStock({
          current: 1,
          pageSize: 1000,
          strategyId: record.strategyId,
          stockCode: record.stockCode,
        });
        
        if (userStockRes && userStockRes.data) {
          const accounts = userStockRes.data
            .filter((item: API.StrategyUserStockItem) => item.account) // 过滤掉account为空的记录
            .map((item: API.StrategyUserStockItem) => ({
              account: item.account!,
              name: item.accountName || item.account!,
            }));
          
          // 去重
          const uniqueAccounts = accounts.filter((account, index, self) => 
            index === self.findIndex(a => a.account === account.account)
          );
          
          setTimeSegmentAllAccounts(uniqueAccounts);
          setTimeSegmentSelectedAccounts([]);
          setTimeSegmentSelectAll(false);
        }
      } catch (error) {
        console.error('获取账户信息失败:', error);
        message.error('获取账户信息失败');
      }
    };
    
    fetchAccountsForStock();
    
    // 解析现有的时段配置
    const timeSegmentMaConfig = parseTimeSegmentMaConfig(record.timeSegmentMaConfig);
    
    // 转换为表单格式
    const formattedConfig = timeSegmentMaConfig.map((config: any) => ({
      timeSegment: config.timeSegment,
      maBelowPercent: config.maBelowPercent * 100, // 转换为百分比显示
      maAbovePercent: config.maAbovePercent * 100,
      profitPercent: config.profitPercent * 100,
    }));
    
    // 设置表单数据
    timeSegmentForm.setFieldsValue({
      timeSegmentMaConfigInput: formattedConfig.length > 0 ? formattedConfig : [],
    });
    
    setTimeSegmentModalVisible(true);
  };

  // 生成默认时间段配置
  const generateDefaultTimeSegments = () => {
    const defaultSegments = [
      { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1 },
      { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1 },
      { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1 },
    ];
    
    timeSegmentForm.setFieldsValue({
      timeSegmentMaConfigInput: defaultSegments
    });
  };

  // 校验时间段格式
  const validateTimeSegment = (timeSegment: string) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeSegment);
  };

  // 将时间字符串转换为分钟数（用于排序）
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // 处理账户选择
  const handleTimeSegmentAccountChange = (selectedAccounts: string[]) => {
    setTimeSegmentSelectedAccounts(selectedAccounts);
    setTimeSegmentSelectAll(selectedAccounts.length === timeSegmentAllAccounts.length);
  };
  
  // 处理全选
  const handleTimeSegmentSelectAll = (checked: boolean) => {
    setTimeSegmentSelectAll(checked);
    if (checked) {
      setTimeSegmentSelectedAccounts(timeSegmentAllAccounts.map(acc => acc.account));
    } else {
      setTimeSegmentSelectedAccounts([]);
    }
  };
  
  // 应用时段配置到选中的账户
  const handleApplyTimeSegmentConfigToAccounts = async (values: any) => {
    if (!timeSegmentCurrentRecord) return;
    
    const { timeSegmentMaConfigInput } = values;
    
    // 验证时段配置
    if (!timeSegmentMaConfigInput || timeSegmentMaConfigInput.length === 0) {
      message.error('请至少添加一个时段配置');
      return;
    }
    
    // 验证账户选择
    if (timeSegmentSelectedAccounts.length === 0) {
      message.error('请选择要应用配置的账户');
      return;
    }
    
    // 验证时段格式和重复性
    const timeSegments = timeSegmentMaConfigInput.map((item: any) => item.timeSegment);
    const uniqueTimeSegments = [...new Set(timeSegments)];
    
    if (uniqueTimeSegments.length !== timeSegments.length) {
      message.error('时段配置中存在重复的时间段');
      return;
    }
    
    // 验证时段格式
    for (const item of timeSegmentMaConfigInput) {
      if (!validateTimeSegment(item.timeSegment)) {
        message.error(`时段 ${item.timeSegment} 格式不正确，请使用 HH:mm 格式`);
        return;
      }
    }
    
    // 按时间排序并转换百分比为小数
    const sortedConfig = timeSegmentMaConfigInput
      .sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment))
      .map((item: any) => ({
        timeSegment: item.timeSegment,
        maBelowPercent: item.maBelowPercent / 100, // 百分比转小数
        maAbovePercent: item.maAbovePercent / 100, // 百分比转小数
        profitPercent: item.profitPercent / 100, // 百分比转小数
      }));
    
    // 构建时段配置字符串
    const timeSegmentMaConfig = JSON.stringify(sortedConfig);
    
    try {
      // 获取需要更新的策略用户股票关系记录
      const userStockRes = await listStrategyUserStock({
        current: 1,
        pageSize: 1000,
        strategyId: timeSegmentCurrentRecord.strategyId,
        stockCode: timeSegmentCurrentRecord.stockCode,
      });
      
      if (userStockRes && userStockRes.data) {
        // 过滤出选中账户的记录
        const targetRecords = userStockRes.data.filter((item: API.StrategyUserStockItem) => 
          timeSegmentSelectedAccounts.includes(item.account!)
        );
        
        if (targetRecords.length === 0) {
          message.error('未找到选中账户的相关记录');
          return;
        }
        
        // 批量更新
        const ids = targetRecords.map(record => record.id!);
        await batchUpdateStrategyUserStockTimeSegmentConfig({
          ids,
          timeSegmentMaConfig,
          stockCode: timeSegmentCurrentRecord.stockCode || '',
        });
        
        message.success(`成功应用时段配置到 ${targetRecords.length} 个账户`);
        setTimeSegmentModalVisible(false);
        setTimeSegmentCurrentRecord(null);
        setTimeSegmentSelectedAccounts([]);
        setTimeSegmentSelectAll(false);
        
        // 通知父组件时段配置对话框已完成
        if (onTimeSegmentConfigComplete) {
          onTimeSegmentConfigComplete();
        }
        
        // 刷新数据
        actionRef.current?.reload();
      }
    } catch (error) {
      console.error('应用时段配置到账户失败:', error);
      message.error('应用时段配置到账户失败，请重试');
    }
  };
  
  // 保存时段配置
  const handleSaveTimeSegmentConfig = async (values: any) => {
    if (!timeSegmentCurrentRecord) return;
    
    const { timeSegmentMaConfigInput } = values;
    
    // 验证时段配置
    if (!timeSegmentMaConfigInput || timeSegmentMaConfigInput.length === 0) {
      message.error('请至少添加一个时段配置');
      return;
    }
    
    // 验证时段格式和重复性
    const timeSegments = timeSegmentMaConfigInput.map((item: any) => item.timeSegment);
    const uniqueTimeSegments = [...new Set(timeSegments)];
    
    if (uniqueTimeSegments.length !== timeSegments.length) {
      message.error('时段配置中存在重复的时间段');
      return;
    }
    
    // 验证时段格式
    for (const item of timeSegmentMaConfigInput) {
      if (!validateTimeSegment(item.timeSegment)) {
        message.error(`时段 ${item.timeSegment} 格式不正确，请使用 HH:mm 格式`);
        return;
      }
    }
    
    // 按时间排序并转换百分比为小数
    const sortedConfig = timeSegmentMaConfigInput
      .sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment))
      .map((item: any) => ({
        timeSegment: item.timeSegment,
        maBelowPercent: item.maBelowPercent / 100, // 百分比转小数
        maAbovePercent: item.maAbovePercent / 100, // 百分比转小数
        profitPercent: item.profitPercent / 100, // 百分比转小数
      }));
    
    // 构建时段配置字符串
    const timeSegmentMaConfig = JSON.stringify(sortedConfig);
    
    try {
      // 使用批量更新时段配置接口，单独编辑时清空档位ID
      await batchUpdateStrategyStockTimeSegmentConfig({
        ids: [timeSegmentCurrentRecord.id!],
        timeSegmentMaConfig,
      });
      
      message.success('时段配置模板保存成功');
      
      // 刷新数据
      actionRef.current?.reload();
      
      // 关闭对话框
      setTimeSegmentModalVisible(false);
      setTimeSegmentCurrentRecord(null);
      setTimeSegmentSelectedAccounts([]);
      setTimeSegmentSelectAll(false);
      
      // 重新加载档位等级映射
      await loadTimeSegmentTemplateLevelMap();
      
      // 通知父组件时段配置对话框已完成
      if (onTimeSegmentConfigComplete) {
        onTimeSegmentConfigComplete();
      }
    } catch (error) {
      console.error('保存时段配置失败:', error);
      message.error('保存时段配置失败，请重试');
    }
  };
  
  // 批量更新策略股票关系状态
  const handleBatchUpdateStatus = async (status: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    const hide = message.loading('批量更新状态中...');
    
    try {
      const result = await batchUpdateStrategyStockStatus({ 
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

  useEffect(() => {
    loadTimeSegmentTemplateLevels();
    loadTimeSegmentTemplateLevelMap();
  }, []);

  // 处理档位搜索
  const handleTimeSegmentTemplateSearch = () => {
    const values = timeSegmentTemplateSearchForm.getFieldsValue();
    const searchConditions = {
      stockCode: values.stockCode || '',
      templateLevel: values.templateLevel || '',
    };
    setTimeSegmentTemplateSearchParams(searchConditions);
    loadTimeSegmentTemplates(searchConditions);
  };

  // 重置档位搜索
  const handleTimeSegmentTemplateSearchReset = () => {
    timeSegmentTemplateSearchForm.resetFields();
    setTimeSegmentTemplateSearchParams({
      stockCode: '',
      templateLevel: '',
    });
    loadTimeSegmentTemplates();
  };

  // 档位等级选项
  const templateLevelOptions = [
    { value: 'A', label: 'A档位' },
    { value: 'B', label: 'B档位' },
    { value: 'C', label: 'C档位' },
    { value: 'D', label: 'D档位' },
    { value: 'S', label: 'S档位' },
  ];

  // 批量切换档位
  const handleBatchSwitchTemplateLevel = async () => {
    if (!selectedBatchTemplateLevel) {
      message.error('请选择档位等级');
      return;
    }
    
    if (selectedRowKeys.length === 0) {
      message.error('请选择要切换档位的记录');
      return;
    }
    
    const hide = message.loading('正在批量切换档位...');
    try {
      const response = await batchSwitchStrategyStockTemplateLevel({
        ids: selectedRowKeys as number[],
        templateLevel: selectedBatchTemplateLevel
      });
      hide();
      
      if (response && response.success && response.data) {
        const result = response.data;
        setBatchSwitchExecutionResult(result);
        
        // 显示详细的执行结果
        const statusType = result.isSuccess ? 'success' : 
                          result.isPartialSuccess ? 'warning' : 
                          result.isFailure ? 'error' : 'info';
        
        // 构建详细消息
        const detailMessage = (
          <div>
            <div style={{ marginBottom: 8, fontWeight: 'bold' }}>
              {result.statusMessage}
            </div>
            <div style={{ marginBottom: 4 }}>
              {result.summaryMessage}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: 8 }}>
              {result.detailMessage}
            </div>
            <Button 
              size="small" 
              type="link" 
              onClick={() => setBatchSwitchResultDetailModalVisible(true)}
              style={{ padding: 0 }}
            >
              查看详情
            </Button>
          </div>
        );
        
        // 根据结果类型显示不同的消息
        if (result.isSuccess) {
          message.success({
            content: detailMessage,
            duration: 8,
          });
        } else if (result.isPartialSuccess) {
          message.warning({
            content: detailMessage,
            duration: 10,
          });
        } else if (result.isFailure) {
          message.error({
            content: detailMessage,
            duration: 10,
          });
        } else {
          message.info({
            content: detailMessage,
            duration: 6,
          });
        }
      } else {
        message.success('批量切换档位成功！');
      }
      
      setBatchSwitchTemplateLevelModalVisible(false);
      setSelectedRowKeys([]);
      setSelectedBatchTemplateLevel('');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('批量切换档位失败！');
      return false;
    }
  };

  // 渲染批量切换档位执行结果详情
  const renderBatchSwitchExecutionResultDetail = () => {
    if (!batchSwitchExecutionResult) return null;

    const getStatusColor = (status: string): "success" | "info" | "error" | "warning" => {
      switch (status) {
        case 'SUCCESS':
          return 'success';
        case 'PARTIAL_SUCCESS':
          return 'warning';
        case 'NO_CONFIG':
          return 'error';
        case 'NO_DATA':
          return 'info';
        default:
          return 'info';
      }
    };

    return (
      <Modal
        title="批量切换档位执行结果详情"
        open={batchSwitchResultDetailModalVisible}
        onCancel={() => setBatchSwitchResultDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBatchSwitchResultDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <Alert
            type={getStatusColor(batchSwitchExecutionResult.status)}
            message={batchSwitchExecutionResult.statusMessage}
            description={batchSwitchExecutionResult.detailMessage}
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Card title="执行统计" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="总处理数量">
                {batchSwitchExecutionResult.totalProcessCount}
              </Descriptions.Item>
              <Descriptions.Item label="成功数量">
                <span style={{ color: '#52c41a' }}>{batchSwitchExecutionResult.totalSuccessCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="未配置数量">
                <span style={{ color: '#ff4d4f' }}>{batchSwitchExecutionResult.totalNoConfigCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="成功率">
                {batchSwitchExecutionResult.totalProcessCount > 0 
                  ? `${((batchSwitchExecutionResult.totalSuccessCount / batchSwitchExecutionResult.totalProcessCount) * 100).toFixed(1)}%`
                  : '0%'
                }
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="策略标的统计" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="总数量">
                {batchSwitchExecutionResult.strategyStockTotalCount}
              </Descriptions.Item>
              <Descriptions.Item label="成功数量">
                <span style={{ color: '#52c41a' }}>{batchSwitchExecutionResult.strategyStockSuccessCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="未配置数量">
                <span style={{ color: '#ff4d4f' }}>{batchSwitchExecutionResult.strategyStockNoConfigCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="成功率">
                {batchSwitchExecutionResult.strategyStockTotalCount > 0 
                  ? `${((batchSwitchExecutionResult.strategyStockSuccessCount / batchSwitchExecutionResult.strategyStockTotalCount) * 100).toFixed(1)}%`
                  : '0%'
                }
              </Descriptions.Item>
            </Descriptions>
            
            {batchSwitchExecutionResult.strategyStockNoConfigList && batchSwitchExecutionResult.strategyStockNoConfigList.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginBottom: 8, color: '#ff4d4f' }}>未找到配置的策略标的：</h4>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 8 }}>
                  {batchSwitchExecutionResult.strategyStockNoConfigList.map((item, index) => (
                    <div key={item.id} style={{ 
                      padding: '4px 8px', 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff',
                      borderRadius: 2,
                      marginBottom: 2
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{item.stockCode}</span>
                      {item.stockName && <span style={{ marginLeft: 8, color: '#666' }}>({item.stockName})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="策略用户股票关系统计">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="总数量">
                {batchSwitchExecutionResult.strategyUserStockTotalCount}
              </Descriptions.Item>
              <Descriptions.Item label="成功数量">
                <span style={{ color: '#52c41a' }}>{batchSwitchExecutionResult.strategyUserStockSuccessCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="未配置数量">
                <span style={{ color: '#ff4d4f' }}>{batchSwitchExecutionResult.strategyUserStockNoConfigCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="成功率">
                {batchSwitchExecutionResult.strategyUserStockTotalCount > 0 
                  ? `${((batchSwitchExecutionResult.strategyUserStockSuccessCount / batchSwitchExecutionResult.strategyUserStockTotalCount) * 100).toFixed(1)}%`
                  : '0%'
                }
              </Descriptions.Item>
            </Descriptions>
            
            {batchSwitchExecutionResult.strategyUserStockNoConfigList && batchSwitchExecutionResult.strategyUserStockNoConfigList.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginBottom: 8, color: '#ff4d4f' }}>未找到配置的策略用户股票关系：</h4>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 8 }}>
                  {batchSwitchExecutionResult.strategyUserStockNoConfigList.map((item, index) => (
                    <div key={item.id} style={{ 
                      padding: '4px 8px', 
                      backgroundColor: index % 2 === 0 ? '#fafafa' : '#fff',
                      borderRadius: 2,
                      marginBottom: 2
                    }}>
                      <span style={{ fontWeight: 'bold' }}>{item.account}</span>
                      {item.accountName && <span style={{ marginLeft: 8, color: '#666' }}>({item.accountName})</span>}
                      <span style={{ margin: '0 8px', color: '#999' }}>-</span>
                      <span style={{ fontWeight: 'bold' }}>{item.stockCode}</span>
                      {item.stockName && <span style={{ marginLeft: 8, color: '#666' }}>({item.stockName})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </Modal>
    );
  };

  // 批量更新策略股票关系收盘前盈利卖出状态
  const handleBatchUpdateProfitSellBeforeClose = async (enableProfitSellBeforeClose: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    const hide = message.loading('批量更新中...');
    
    try {
      const result = await batchUpdateStrategyStockProfitSellBeforeClose({ 
        ids: selectedRowKeys as number[], 
        enableProfitSellBeforeClose 
      });
      hide();
      const displayText = PROFIT_SELL_BEFORE_CLOSE_ENUM[enableProfitSellBeforeClose as keyof typeof PROFIT_SELL_BEFORE_CLOSE_ENUM] || enableProfitSellBeforeClose;
      message.success(`已成功更新 ${selectedRowKeys.length} 条记录为"${displayText}"`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('批量更新失败');
      return false;
    }
  };

  // 批量更新策略股票关系昨天最低价买入状态
  const handleBatchUpdateYesterdayLowestBuy = async (enableYesterdayLowestBuy: boolean) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要更新的记录');
      return;
    }

    const hide = message.loading('批量更新中...');
    
    try {
      const result = await batchUpdateStrategyStockYesterdayLowestBuy({ 
        ids: selectedRowKeys as number[], 
        enableYesterdayLowestBuy 
      });
      hide();
      const displayText = enableYesterdayLowestBuy ? '启用昨天最低价买入' : '禁用昨天最低价买入';
      message.success(`已成功更新 ${selectedRowKeys.length} 条记录为"${displayText}"`);
      setSelectedRowKeys([]);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('批量更新失败');
      return false;
    }
  };

  // 批量立即买入
  const handleBatchImmediateBuy = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要立即买入的股票');
      return;
    }

    // 从选中的记录中获取策略ID
    let effectiveStrategyId = strategyId;
    if (!effectiveStrategyId && currentTableData.length > 0) {
      // 如果props中没有strategyId，从选中的记录中获取
      const firstSelectedRecord = currentTableData.find(item => selectedRowKeys.includes(item.id!));
      if (firstSelectedRecord && firstSelectedRecord.strategyId) {
        effectiveStrategyId = firstSelectedRecord.strategyId;
      }
    }

    if (!effectiveStrategyId) {
      message.error('无法获取策略ID，请确认已选择有效的股票记录');
      return;
    }

    Modal.confirm({
      title: '确认批量立即买入',
      content: (
        <div>
          <p>确定要对选中的 <strong>{selectedRowKeys.length}</strong> 只股票执行立即买入操作吗？</p>
          <p style={{ color: '#ff4d4f', fontSize: '12px' }}>
            ⚠️ 注意：此操作将立即执行买入，不受时间限制，请确认当前为合适的交易时间。
          </p>
        </div>
      ),
      okText: '确认买入',
      cancelText: '取消',
      okType: 'danger',
      width: 500,
      onOk: async () => {
        const hide = message.loading('正在执行批量立即买入...');
        try {
          const result = await batchImmediateBuyStrategyStock({
            ids: selectedRowKeys as number[],
            strategyId: effectiveStrategyId,
            forceExecute: true,
            buyReason: '批量立即买入',
          });
          hide();
          
          if (result.success && result.data) {
            const { totalCount, successCount, failureCount, successStockCodes, failureDetails } = result.data;
            
            // 构建详细的结果消息
            const successMessage = successCount > 0 ? `成功买入 ${successCount} 只股票: ${successStockCodes.join(', ')}` : '';
            const failureMessage = failureCount > 0 ? `失败 ${failureCount} 只股票` : '';
            
            if (successCount === totalCount) {
              message.success(`批量立即买入完成！${successMessage}`);
            } else if (successCount > 0) {
              message.warning(`批量立即买入部分成功！${successMessage}${failureMessage ? `；${failureMessage}` : ''}`);
            } else {
              message.error(`批量立即买入全部失败！${failureMessage}`);
            }
            
            // 如果有失败详情，显示详细信息
            if (failureCount > 0 && failureDetails && failureDetails.length > 0) {
              const failureInfo = failureDetails.map(detail => 
                `${detail.stockCode}${detail.account !== 'N/A' ? `(${detail.account})` : ''}: ${detail.errorMessage}`
              ).join('\n');
              
              Modal.info({
                title: '批量买入失败详情',
                content: (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{failureInfo}</pre>
                  </div>
                ),
                width: 600,
              });
            }
            
            setSelectedRowKeys([]);
            actionRef.current?.reload();
          } else {
            message.error('批量立即买入失败');
          }
        } catch (error) {
          hide();
          message.error('批量立即买入失败');
        }
      },
    });
  };

  return (
    <>
      {renderFilterTag()}
      
      <ProTable<API.StrategyStockItem, API.PageParams>
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          preserveSelectedRowKeys: true,
        }}
        expandable={{
          expandedRowRender: renderExpandedRow,
          onExpand: (expanded, record) => {
            if (expanded && record.strategyId && record.stockCode) {
              // 展开时加载配置数据
              loadExpandedRowConfig(record.strategyId, record.stockCode);
            }
          },
          expandRowByClick: false,
        }}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            onClick={() => {
              setCreateModalVisible(true);
              
              // 如果没有预设策略ID，延迟设置第一个策略为默认值
              if (!strategyId) {
                setTimeout(async () => {
                  if (createFormRef.current) {
                    try {
                      // 获取策略任务列表
                      const res = await listStrategyJob({
                        current: 1,
                        pageSize: 100,
                        status: '1', // 只获取启用状态的策略
                      });
                      
                      if (res && res.data && res.data.length > 0) {
                        const firstStrategy = res.data[0];
                        createFormRef.current.setFieldsValue({
                          strategyId: firstStrategy.id,
                          strategyName: firstStrategy.name,
                        });
                      }
                    } catch (error) {
                      console.error('获取策略列表失败:', error);
                    }
                  }
                }, 100);
              }
            }}
          >
            <PlusOutlined /> <FormattedMessage id="pages.common.new" defaultMessage="New" />
          </Button>,
          <Button
            key="apply"
            type="primary"
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
          <Button
            key="batch-switch-level"
            type="primary"
            onClick={() => {
              if (selectedRowKeys.length === 0) {
                message.warning('请先选择要切换档位的记录');
                return;
              }
              setBatchSwitchTemplateLevelModalVisible(true);
            }}
          >
            <SettingOutlined /> 批量切换档位
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
            key="batch-profit-sell"
            overlay={
              <Menu
                items={[
                  {
                    key: '1',
                    label: '批量设为收盘前总盈利卖出',
                    onClick: () => handleBatchUpdateProfitSellBeforeClose('PROFIT_SELL_BEFORE_CLOSE'),
                  },
                  {
                    key: '2',
                    label: '批量设为收盘前全部卖出',
                    onClick: () => handleBatchUpdateProfitSellBeforeClose('ALL_SELL_BEFORE_CLOSE'),
                  },
                  {
                    key: '3',
                    label: '批量设为不卖出',
                    onClick: () => handleBatchUpdateProfitSellBeforeClose('NO_SELL'),
                  },
                ]}
              />
            }
            disabled={selectedRowKeys.length === 0}
          >
            批量收盘前卖出
          </Dropdown.Button>,
          <Dropdown.Button
            key="batch-yesterday-lowest-buy"
            overlay={
              <Menu
                items={[
                  {
                    key: '1',
                    label: '批量启用昨天最低价买入',
                    onClick: () => handleBatchUpdateYesterdayLowestBuy(true),
                  },
                  {
                    key: '2',
                    label: '批量禁用昨天最低价买入',
                    onClick: () => handleBatchUpdateYesterdayLowestBuy(false),
                  },
                ]}
              />
            }
            disabled={selectedRowKeys.length === 0}
          >
            批量昨天最低价买入
          </Dropdown.Button>,
          <Button
            key="batch-immediate-buy"
            type="primary"
            danger
            disabled={selectedRowKeys.length === 0}
            onClick={handleBatchImmediateBuy}
          >
            <DollarOutlined /> 批量立即买入
          </Button>,
        ]}
        request={(params, sort, filter) => {
          // 添加策略ID作为过滤条件（如果有）
          const queryParams = { ...params } as any;
          if (strategyId) {
            queryParams.strategyId = strategyId;
          }
          
          return listStrategyStock(queryParams).then(response => {
            if (response && response.data) {
              // 处理返回的数据，确保字段有默认值
              const processedData = response.data.map(item => ({
                ...item,
                unsoldStackLimit: item.unsoldStackLimit ?? 4,
                totalFundShares: item.totalFundShares ?? 18,
                limitStartShares: item.limitStartShares ?? 9,
                // 百分比字段保持原样，显示时在render函数中处理
              }));
              
              // 更新当前表格数据状态
              setCurrentTableData(processedData);
              
              return {
                data: processedData,
                success: true,
                total: response.total || processedData.length
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
        pagination={{
          defaultPageSize: 100,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['100', '200', '500', '1000'],
          showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
        }}
      />
      
      {/* 新增策略股票关系表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.stock.relation.create" defaultMessage="Create Strategy Stock Relation" />}
        width="650px"
        formRef={createFormRef}
        form={createForm}
        modalProps={{
          destroyOnClose: true,
          footer: null, // 隐藏默认底部按钮
        }}
        open={createModalVisible}
        onOpenChange={(visible) => {
          setCreateModalVisible(visible);
          if (visible) {
            // @ts-ignore
            createForm.setFieldsValue({
              buyRatioConfigInput: {
                firstShareRatio: defaultFirstShareRatio,
                extraShares: defaultExtraShares,
              },
            });
          }
        }}
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
              createForm.submit();
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
        <ProFormText
          name="stockCode"
          label={<FormattedMessage id="pages.strategy.stock.relation.stockCode" defaultMessage="Stock Code" />}
          rules={[{ required: true }]}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="profitRatio"
          label={<FormattedMessage id="pages.strategy.stock.relation.profitRatio" defaultMessage="Profit Ratio (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.profitRatioTip" defaultMessage="The profit ratio for take-profit settings (in percentage, e.g. 10 means 10%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.01,
            precision: 2,
            addonAfter: '%',
          }}
          initialValue={1}
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
          initialValue={1.5}
          rules={[{ required: true }]}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="maBelowPercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercent" defaultMessage="MA Below Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercentTip" defaultMessage="Buy when price is below moving average by this percentage (in percentage, e.g. 3 means 3%)" />}
          min={-100}
          max={100}
          fieldProps={{
            step: 0.01,
            precision: 2,
            addonAfter: '%',
          }}
          initialValue={0.2}
          rules={[{ required: true }]}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="maAbovePercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercent" defaultMessage="MA Above Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercentTip" defaultMessage="Buy when price is above moving average by this percentage (in percentage, e.g. 0.2 means 0.2%)" />}
          min={-100}
          max={100}
          fieldProps={{
            step: 0.01,
            precision: 2,
            addonAfter: '%',
          }}
          initialValue={0.1}
          rules={[{ required: true }]}
        />
        </div>
        
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="unsoldStackLimit"
          label={<FormattedMessage id="pages.strategy.stock.relation.unsoldStackLimit" defaultMessage="Unsold Stack Limit" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.unsoldStackLimitTip" defaultMessage="Maximum number of open buy orders allowed per day" />}
          min={1}
          max={20}
          fieldProps={{
            step: 1,
            precision: 0,
          }}
          initialValue={4}
          rules={[{ required: true }]}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="totalFundShares"
            label={
              <span>
                <FormattedMessage id="pages.strategy.stock.relation.totalFundShares" defaultMessage="Total Fund Shares" />
                <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.totalFundSharesTip" defaultMessage="The total number of shares the fund is divided into for buying, default 18" />}>
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            min={1}
            max={100}
            fieldProps={{
              step: 1,
              precision: 0,
            }}
            initialValue={20}
            rules={[{ required: true }]}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="limitStartShares"
            label={
              <span>
                <FormattedMessage id="pages.strategy.stock.relation.limitStartShares" defaultMessage="Limit Start Shares" />
                <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.limitStartSharesTip" defaultMessage="From which share to start limiting buying, default 9" />}>
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            min={1}
            max={100}
            fieldProps={{
              step: 1,
              precision: 0,
            }}
            initialValue={9}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="intraUpPullbackPercent"
          label="日内持续上涨并高位回调百分比(%)"
          tooltip="当股票日内持续上涨后从高点回调该百分比时触发买入信号（如3表示3%）"
          min={0}
          max={100}
          fieldProps={{
            step: 0.01,
            precision: 2,
            addonAfter: '%',
          }}
          initialValue={3}
          rules={[{ required: true }]}
        />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="intraUpDurationMinutes"
          label="日内持续上涨时间(分钟)"
          tooltip="当股票持续上涨达到该时间长度时触发买入信号（如30表示30分钟）"
          min={1}
          max={1440}
          fieldProps={{
            step: 1,
            precision: 0,
            addonAfter: '分钟',
          }}
          initialValue={30}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="intraDnBelowAvgPercent"
          label="日内持续下跌并低于分时均价百分比(%)"
          tooltip="当股票日内持续下跌且低于分时均价该百分比时触发买入信号（如1表示1%）"
          min={0}
          max={100}
          fieldProps={{
            step: 0.01,
            precision: 2,
            addonAfter: '%',
          }}
          initialValue={1}
          rules={[{ required: true }]}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="intraDnDurationMinutes"
          label="日内持续下跌时间(分钟)"
          tooltip="当股票持续下跌达到该时间长度时触发买入信号（如30表示30分钟）"
          min={1}
          max={1440}
          fieldProps={{
            step: 1,
            precision: 0,
            addonAfter: '分钟',
          }}
          initialValue={30}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSwitch
            name="enableOpeningBuy"
            label="是否开盘买入"
            tooltip="是否在开盘时执行买入策略，默认开启"
            initialValue={true}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="marketCapScale"
            label="市值规模"
            tooltip="股票的市值规模分类"
            valueEnum={{
              '小盘股': '小盘股',
              '中盘股': '中盘股',
              '大盘股': '大盘股',
              'ETF': 'ETF',
            }}
            placeholder="请选择市值规模"
            rules={[{ required: true }]}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="enableProfitSellBeforeClose"
            label="收盘前盈利卖出"
            tooltip="收盘前盈利卖出策略：收盘前总盈利卖出、收盘前全部卖出、不卖出"
            valueEnum={{
              'PROFIT_SELL_BEFORE_CLOSE': '收盘前总盈利卖出',
              'ALL_SELL_BEFORE_CLOSE': '收盘前全部卖出',
              'NO_SELL': '不卖出',
            }}
            initialValue="PROFIT_SELL_BEFORE_CLOSE"
            rules={[{ required: true }]}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSwitch
            name="enableYesterdayLowestBuy"
            label="昨天最低价买入"
            tooltip="是否在股票价格接近昨天最低价时触发买入信号"
            initialValue={false}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="status"
            label={<FormattedMessage id="pages.strategy.stock.relation.status" defaultMessage="Status" />}
            valueEnum={{
              '0': <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
              '1': <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
            }}
            initialValue="1"
            rules={[{ required: true }]}
          />
        </div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
        <Form.Item
          label={intl.formatMessage({ id: 'pages.strategy.stock.relation.buyRatioConfig', defaultMessage: '买入比例配置' })}
          tooltip={intl.formatMessage({ id: 'pages.strategy.stock.relation.buyRatioConfigTip', defaultMessage: '前limitStartShares个买入单买入比例，后续每档跌幅和买入比例以及是否开启二阶段策略，可动态增删' })}
          required
        >
          <Form.Item
            label={<span>前N档买入资金比例（%）</span>}
            name={['buyRatioConfigInput', 'firstShareRatio']}
            initialValue={defaultFirstShareRatio}
            rules={[{ required: true, message: '必填' }]}
            style={{ width: 180 }}
          >
            <InputNumber min={0} max={100} precision={2} addonAfter="%" />
          </Form.Item>
          
          <div style={{ margin: '12px 0 4px 0', fontWeight: 500 }}>后续档位（跌幅%/买入资金比例%）：</div>
          
          <Form.List name={['buyRatioConfigInput', 'extraShares']}>
            {(extraFields, { add: addExtra, remove: removeExtra }) => (
              <>
                {extraFields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ marginBottom: 4 }}>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'drop']} 
                      rules={[{ required: true, message: '跌幅必填' }]}
                      style={{ margin: 0, width: 100 }}
                    >
                      <InputNumber min={0} max={100} precision={2} addonAfter="%" placeholder="跌幅" />
                    </Form.Item>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'ratio']} 
                      rules={[{ required: true, message: '买入比例必填' }]}
                      style={{ margin: 0, width: 100 }}
                    >
                      <InputNumber min={0} max={100} precision={2} addonAfter="%" placeholder="买入比例" />
                    </Form.Item>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'secondStage']} 
                      valuePropName="checked"
                      initialValue={false}
                      style={{ margin: 0, width: 160 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>{intl.formatMessage({ id: 'pages.strategy.stock.relation.secondStage', defaultMessage: '二阶段:' })}</span>
                        <Tooltip title={intl.formatMessage({ id: 'pages.strategy.stock.relation.secondStageTip', defaultMessage: '该档位盈利卖出后是否启动二阶段策略' })}>
                          <Switch 
                            size="small" 
                            checked={createForm.getFieldValue(['buyRatioConfigInput', 'extraShares', field.name, 'secondStage']) || false}
                            onChange={(checked) => {
                              // 手动设置表单的值
                              const currentExtraShares = createForm.getFieldValue(['buyRatioConfigInput', 'extraShares']) || [];
                              
                              if (checked) {
                                // 如果选中当前档位，需要取消其他档位的选中状态
                                currentExtraShares.forEach((share: any, index: number) => {
                                  if (share && index !== field.name) {
                                    share.secondStage = false;
                                  }
                                });
                              }
                              
                              // 设置当前档位状态
                              if (currentExtraShares[field.name]) {
                                currentExtraShares[field.name].secondStage = checked;
                              }
                              
                              // 更新表单数据
                              createForm.setFieldsValue({
                                buyRatioConfigInput: {
                                  ...createForm.getFieldValue('buyRatioConfigInput'),
                                  extraShares: currentExtraShares
                                }
                              });
                              
                              console.log('设置新建表单二阶段值:', field.name, checked, 
                                '互斥模式，当前所有档位状态:', 
                                currentExtraShares.map((s: any, i: number) => 
                                  `档位${i}: ${s?.secondStage ? '开启' : '关闭'}`).join(', ')
                              );
                            }}
                          />
                        </Tooltip>
                      </div>
                    </Form.Item>
                    {extraFields.length > 1 && <MinusCircleOutlined onClick={() => removeExtra(field.name)} />}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => {
                  const newItem = { drop: 7, ratio: 3, secondStage: false };
                  console.log('添加新档位默认值:', JSON.stringify(newItem));
                  addExtra(newItem);
                }} icon={<PlusOutlined />}>添加档位</Button>
              </>
            )}
          </Form.List>
        </Form.Item>
        </div>
      </ModalForm>
      
      {/* 编辑策略股票关系表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.stock.relation.edit" defaultMessage="Edit Strategy Stock Relation" />}
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
          if (visible && currentRow) {
            // 确保正确解析buyRatioConfig
            const buyRatioConfigInput = parseBuyRatioConfig(currentRow.buyRatioConfig);
            
            // 设置表单值
            // @ts-ignore
            updateForm.setFieldsValue({
              ...currentRow,
              buyRatioConfigInput
            });
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
          name="stockCode"
          label={<FormattedMessage id="pages.strategy.stock.relation.stockCode" defaultMessage="Stock Code" />}
          rules={[{ required: true }]}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="profitRatio"
          label={<FormattedMessage id="pages.strategy.stock.relation.profitRatio" defaultMessage="Profit Ratio (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.profitRatioTip" defaultMessage="The profit ratio for take-profit settings (in percentage, e.g. 10 means 10%)" />}
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
        <ProFormDigit
          name="maBelowPercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercent" defaultMessage="MA Below Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercentTip" defaultMessage="Buy when price is below moving average by this percentage (in percentage, e.g. 3 means 3%)" />}
          min={-100}
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
          name="maAbovePercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercent" defaultMessage="MA Above Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercentTip" defaultMessage="Buy when price is above moving average by this percentage (in percentage, e.g. 0.2 means 0.2%)" />}
          min={-100}
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
          label={<FormattedMessage id="pages.strategy.stock.relation.unsoldStackLimit" defaultMessage="Unsold Stack Limit" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.unsoldStackLimitTip" defaultMessage="Maximum number of open buy orders allowed per day" />}
          min={1}
          max={20}
          fieldProps={{
            step: 1,
            precision: 0,
          }}
          initialValue={4}
          rules={[{ required: true }]}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="totalFundShares"
            label={
              <span>
                <FormattedMessage id="pages.strategy.stock.relation.totalFundShares" defaultMessage="Total Fund Shares" />
                <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.totalFundSharesTip" defaultMessage="The total number of shares the fund is divided into for buying, default 18" />}>
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            min={1}
            max={100}
            fieldProps={{
              step: 1,
              precision: 0,
            }}
            initialValue={20}
            rules={[{ required: true }]}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="limitStartShares"
            label={
              <span>
                <FormattedMessage id="pages.strategy.stock.relation.limitStartShares" defaultMessage="Limit Start Shares" />
                <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.limitStartSharesTip" defaultMessage="From which share to start limiting buying, default 9" />}>
                  <QuestionCircleOutlined style={{ marginLeft: 4 }} />
                </Tooltip>
              </span>
            }
            min={1}
            max={100}
            fieldProps={{
              step: 1,
              precision: 0,
            }}
            initialValue={9}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="intraUpPullbackPercent"
          label="日内持续上涨并高位回调百分比(%)"
          tooltip="当股票日内持续上涨后从高点回调该百分比时触发买入信号（如3表示3%）"
          min={0}
          max={100}
          fieldProps={{
            step: 0.01,
            precision: 2,
            addonAfter: '%',
          }}
        />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="intraUpDurationMinutes"
          label="日内持续上涨时间(分钟)"
          tooltip="当股票持续上涨达到该时间长度时触发买入信号（如30表示30分钟）"
          min={1}
          max={1440}
          fieldProps={{
            step: 1,
            precision: 0,
            addonAfter: '分钟',
          }}
          initialValue={30}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="intraDnBelowAvgPercent"
          label="日内持续下跌并低于分时均价百分比(%)"
          tooltip="当股票日内持续下跌且低于分时均价该百分比时触发买入信号（如1表示1%）"
          min={0}
          max={100}
          fieldProps={{
            step: 0.01,
            precision: 2,
            addonAfter: '%',
          }}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
        <ProFormDigit
          name="intraDnDurationMinutes"
          label="日内持续下跌时间(分钟)"
          tooltip="当股票持续下跌达到该时间长度时触发买入信号（如30表示30分钟）"
          min={1}
          max={1440}
          fieldProps={{
            step: 1,
            precision: 0,
            addonAfter: '分钟',
          }}
          initialValue={30}
        />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSwitch
            name="enableOpeningBuy"
            label="是否开盘买入"
            tooltip="是否在开盘时执行买入策略，默认开启"
            initialValue={true}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="marketCapScale"
            label="市值规模"
            tooltip="股票的市值规模分类"
            valueEnum={{
              '小盘股': '小盘股',
              '中盘股': '中盘股',
              '大盘股': '大盘股',
              'ETF': 'ETF',
            }}
            placeholder="请选择市值规模"
            rules={[{ required: true }]}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="enableProfitSellBeforeClose"
            label="收盘前盈利卖出"
            tooltip="收盘前盈利卖出策略：收盘前总盈利卖出、收盘前全部卖出、不卖出"
            valueEnum={{
              'PROFIT_SELL_BEFORE_CLOSE': '收盘前总盈利卖出',
              'ALL_SELL_BEFORE_CLOSE': '收盘前全部卖出',
              'NO_SELL': '不卖出',
            }}
            initialValue="PROFIT_SELL_BEFORE_CLOSE"
            rules={[{ required: true }]}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSwitch
            name="enableYesterdayLowestBuy"
            label="昨天最低价买入"
            tooltip="是否在股票价格接近昨天最低价时触发买入信号"
            initialValue={false}
          />
        </div>
        
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="status"
            label={<FormattedMessage id="pages.strategy.stock.relation.status" defaultMessage="Status" />}
            valueEnum={{
              '0': <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
              '1': <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
            }}
            rules={[{ required: true }]}
          />
        </div>
        </div>
        
        <div style={{ marginTop: '16px' }}>
        <Form.Item
          label={intl.formatMessage({ id: 'pages.strategy.stock.relation.buyRatioConfig', defaultMessage: '买入比例配置' })}
          tooltip={intl.formatMessage({ id: 'pages.strategy.stock.relation.buyRatioConfigTip', defaultMessage: '前limitStartShares个买入单买入比例，后续每档跌幅和买入比例以及是否开启二阶段策略，可动态增删' })}
          required
        >
          <Form.Item
            label={<span>前N档单次买入比例（%）</span>}
            name={['buyRatioConfigInput', 'firstShareRatio']}
            initialValue={defaultFirstShareRatio}
            rules={[{ required: true, message: '必填' }]}
            style={{ width: 180 }}
          >
            <InputNumber min={0} max={100} precision={2} addonAfter="%" />
          </Form.Item>
          
          <div style={{ margin: '12px 0 4px 0', fontWeight: 500 }}>后续档位（跌幅%/买入资金比例%）：</div>
          
          <Form.List name={['buyRatioConfigInput', 'extraShares']}>
            {(extraFields, { add: addExtra, remove: removeExtra }) => (
              <>
                {extraFields.map((field) => (
                  <Space key={field.key} align="baseline" style={{ marginBottom: 4 }}>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'drop']} 
                      rules={[{ required: true, message: '跌幅必填' }]}
                      style={{ margin: 0, width: 100 }}
                    >
                      <InputNumber min={0} max={100} precision={2} addonAfter="%" placeholder="跌幅" />
                    </Form.Item>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'ratio']} 
                      rules={[{ required: true, message: '买入比例必填' }]}
                      style={{ margin: 0, width: 100 }}
                    >
                      <InputNumber min={0} max={100} precision={2} addonAfter="%" placeholder="买入比例" />
                    </Form.Item>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'secondStage']} 
                      valuePropName="checked"
                      initialValue={false}
                      style={{ margin: 0, width: 160 }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: '8px' }}>{intl.formatMessage({ id: 'pages.strategy.stock.relation.secondStage', defaultMessage: '二阶段:' })}</span>
                        <Tooltip title={intl.formatMessage({ id: 'pages.strategy.stock.relation.secondStageTip', defaultMessage: '该档位盈利卖出后是否启动二阶段策略' })}>
                          <Switch 
                            size="small" 
                            checked={updateForm.getFieldValue(['buyRatioConfigInput', 'extraShares', field.name, 'secondStage']) || false}
                            onChange={(checked) => {
                              // 手动设置表单的值
                              const currentExtraShares = updateForm.getFieldValue(['buyRatioConfigInput', 'extraShares']) || [];
                              
                              if (checked) {
                                // 如果选中当前档位，需要取消其他档位的选中状态
                                currentExtraShares.forEach((share: any, index: number) => {
                                  if (share && index !== field.name) {
                                    share.secondStage = false;
                                  }
                                });
                              }
                              
                              // 设置当前档位状态
                              if (currentExtraShares[field.name]) {
                                currentExtraShares[field.name].secondStage = checked;
                              }
                              
                              // 更新表单数据
                              updateForm.setFieldsValue({
                                buyRatioConfigInput: {
                                  ...updateForm.getFieldValue('buyRatioConfigInput'),
                                  extraShares: currentExtraShares
                                }
                              });
                              
                              console.log('设置编辑表单二阶段值:', field.name, checked, 
                                '互斥模式，当前所有档位状态:', 
                                currentExtraShares.map((s: any, i: number) => 
                                  `档位${i}: ${s?.secondStage ? '开启' : '关闭'}`).join(', ')
                              );
                            }}
                          />
                        </Tooltip>
                      </div>
                    </Form.Item>
                    {extraFields.length > 1 && <MinusCircleOutlined onClick={() => removeExtra(field.name)} />}
                  </Space>
                ))}
                <Button type="dashed" onClick={() => {
                  const newItem = { drop: 7, ratio: 3, secondStage: false };
                  console.log('添加新档位默认值:', JSON.stringify(newItem));
                  addExtra(newItem);
                }} icon={<PlusOutlined />}>添加档位</Button>
              </>
            )}
          </Form.List>
        </Form.Item>
        </div>
      </ModalForm>

      {/* 保存配置模版Modal */}
      <ModalForm
        title="保存配置模版"
        width="500px"
        formRef={saveTemplateFormRef}
        modalProps={{
          destroyOnClose: true,
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
      >
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
        okText="应用模版"
        cancelText="取消"
      >
        {/* 显示当前过滤的股票代码 */}
        {selectedRowKeys.length > 0 && (
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
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {templates.map((template) => (
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
              ))}
            </div>
          </Radio.Group>
        </div>
        {templates.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            {selectedRowKeys.length > 0 ? '暂无匹配的模版' : '暂无模版'}
            {selectedRowKeys.length > 0 && (
              <div style={{ fontSize: '12px', marginTop: 8 }}>
                请先创建包含相同股票代码的模版
              </div>
            )}
          </div>
        )}
        <div style={{ color: '#666', fontSize: '12px' }}>
          <strong>说明：</strong>选择一个模版后，将其配置应用到当前选中的 {selectedRowKeys.length} 个目标配置中。
        </div>
      </Modal>

      {/* 时段分时平均线配置对话框 */}
      <Modal
        title={`时段分时平均线配置 - ${timeSegmentCurrentRecord?.stockCode || ''}`}
        open={timeSegmentModalVisible}
        onCancel={() => {
          setTimeSegmentModalVisible(false);
          setTimeSegmentCurrentRecord(null);
          setTimeSegmentSelectedAccounts([]);
          setTimeSegmentSelectAll(false);
          // 刷新列表数据
          actionRef.current?.reload();
          // 通知父组件时段配置对话框已关闭
          if (onTimeSegmentConfigComplete) {
            onTimeSegmentConfigComplete();
          }
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
                setTimeSegmentSelectedAccounts([]);
                setTimeSegmentSelectAll(false);
                // 刷新列表数据
                actionRef.current?.reload();
                // 通知父组件时段配置对话框已关闭
                if (onTimeSegmentConfigComplete) {
                  onTimeSegmentConfigComplete();
                }
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
              onClick={() => {
                const initialValues = {
                  templateName: `${timeSegmentCurrentRecord?.stockCode || ''}_时段配置_档位`,
                  useScenario: '策略股票时段配置',
                  strategyId: timeSegmentCurrentRecord?.strategyId,
                  strategyName: timeSegmentCurrentRecord?.strategyName || strategyName,
                  stockCode: timeSegmentCurrentRecord?.stockCode,
                  configType: 'STOCK',
                };
                timeSegmentTemplateForm.setFieldsValue(initialValues);
                setTimeSegmentTemplateModalVisible(true);
              }}
            >
              保存为档位
            </Button>
            <Button 
              type="dashed"
              onClick={() => {
                // 设置默认搜索条件为当前股票
                const defaultSearchParams = {
                  stockCode: timeSegmentCurrentRecord?.stockCode || '',
                  templateLevel: '',
                };
                
                // 设置搜索表单的默认值
                timeSegmentTemplateSearchForm.setFieldsValue(defaultSearchParams);
                setTimeSegmentTemplateSearchParams(defaultSearchParams);
                
                // 加载档位模板，并传入默认搜索条件
                loadTimeSegmentTemplates(defaultSearchParams);
                setTimeSegmentApplyTemplateModalVisible(true);
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
            <Button 
              type="primary"
              disabled={timeSegmentSelectedAccounts.length === 0}
              onClick={() => {
                timeSegmentForm.validateFields().then(values => {
                  handleApplyTimeSegmentConfigToAccounts(values);
                });
              }}
            >
              应用到账户 ({timeSegmentSelectedAccounts.length})
            </Button>
          </div>
          
          {/* 账户选择区域 */}
          {timeSegmentAllAccounts.length > 0 && (
            <div style={{ 
              marginBottom: 16, 
              padding: 16, 
              backgroundColor: '#fafafa',
              borderRadius: 6,
              border: '1px solid #d9d9d9'
            }}>
              <div style={{ marginBottom: 12 }}>
                <Checkbox
                  checked={timeSegmentSelectAll}
                  onChange={(e) => handleTimeSegmentSelectAll(e.target.checked)}
                  style={{ fontWeight: 'bold' }}
                >
                  全选账户 ({timeSegmentAllAccounts.length})
                </Checkbox>
              </div>
              
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 8,
                marginBottom: 12
              }}>
                {timeSegmentAllAccounts.map(account => (
                  <Checkbox
                    key={account.account}
                    checked={timeSegmentSelectedAccounts.includes(account.account)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleTimeSegmentAccountChange([...timeSegmentSelectedAccounts, account.account]);
                      } else {
                        handleTimeSegmentAccountChange(timeSegmentSelectedAccounts.filter(acc => acc !== account.account));
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: timeSegmentSelectedAccounts.includes(account.account) ? '#e6f7ff' : '#fff',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      minWidth: 120
                    }}
                  >
                    {account.name}
                  </Checkbox>
                ))}
              </div>
              
              <div style={{ fontSize: '12px', color: '#666' }}>
                {timeSegmentSelectedAccounts.length === 0 
                  ? '请选择要应用配置的账户' 
                  : `已选择 ${timeSegmentSelectedAccounts.length} 个账户`}
              </div>
              
              {/* 覆盖提示 */}
              {timeSegmentSelectedAccounts.length > 0 && (
                <div style={{ 
                  marginTop: 12,
                  padding: 8,
                  backgroundColor: '#fff7e6',
                  border: '1px solid #ffd591',
                  borderRadius: 4,
                  fontSize: '12px',
                  color: '#d46b08'
                }}>
                  <strong>⚠️ 重要提示：</strong>应用到账户将会覆盖选中账户的原有时段配置，请确认后再操作。
                </div>
              )}
            </div>
          )}
        </div>
        
        <Form
          form={timeSegmentForm}
          onFinish={handleSaveTimeSegmentConfig}
          layout="vertical"
        >
          <Form.Item
            label="时段配置"
            tooltip="不同时段的分时平均线买入配置，可动态增删"
            required
          >
            <Form.List name="timeSegmentMaConfigInput">
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
                        onClick={generateDefaultTimeSegments}
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
                            min={-100} 
                            max={100} 
                            precision={2} 
                            addonAfter="%" 
                            placeholder="0.50" 
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
                            min={-100} 
                            max={100} 
                            precision={2} 
                            addonAfter="%" 
                            placeholder="0.10" 
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
                            min={-100} 
                            max={100} 
                            precision={2} 
                            addonAfter="%" 
                            placeholder="0.10" 
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', height: '32px' }}>
                        <MinusCircleOutlined 
                          onClick={() => removeTimeSegment(field.name)}
                          style={{ color: '#ff4d4f', fontSize: '16px', cursor: 'pointer' }}
                        />
                      </div>
                    </div>
                  ))}
                  
                  {timeSegmentFields.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button 
                        type="dashed" 
                        onClick={() => {
                          const newItem = { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 0.1 };
                          addTimeSegment(newItem);
                        }} 
                        icon={<PlusOutlined />}
                        style={{ flex: 1 }}
                      >
                        添加时段
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Form.List>
          </Form.Item>
          
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 4 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>说明：</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              • 时段格式：HH:mm（如 09:30），支持00:00-23:59<br/>
              • 下方%：股价低于分时平均线该百分比时买入，可为负数<br/>
              • 上方%：股价高于分时平均线该百分比时买入，可为负数<br/>
              • 盈利点：股价高于分时平均线该百分比时买入，可为负数<br/>
              • 系统会自动检查时间段重复并按时间顺序排序<br/>
              • 默认时间段：09:30(0.5%,0.1%,0.1%), 12:00(1.0%,-0.5%,-0.5%), 14:00(1.5%,-1.0%,-1.0%)
            </div>
          </div>
        </Form>
      </Modal>

      {/* 时段配置档位保存对话框 */}
      <ModalForm
        title="保存时段配置档位"
        width="500px"
        formRef={timeSegmentTemplateFormRef}
        modalProps={{
          destroyOnClose: true,
        }}
        open={timeSegmentTemplateModalVisible}
        onOpenChange={(visible) => {
          setTimeSegmentTemplateModalVisible(visible);
          if (!visible) {
            timeSegmentTemplateForm.resetFields();
          }
        }}
        onFinish={handleSaveTimeSegmentAsTemplate}
        initialValues={{
          strategyId: timeSegmentCurrentRecord?.strategyId,
          strategyName: timeSegmentCurrentRecord?.strategyName || strategyName,
          stockCode: timeSegmentCurrentRecord?.stockCode,
          configType: 'STOCK',
        }}
      >
        {/* 档位等级放在最上方 */}
        <ProFormSelect
          name="templateLevel"
          label="档位等级"
          placeholder="请选择档位等级"
          options={timeSegmentTemplateLevels}
          rules={[{ required: true, message: '请选择档位等级' }]}
          fieldProps={{
            onChange: (value: any) => {
              // 根据选中的档位等级自动生成档位名称
              const stockCode = timeSegmentCurrentRecord?.stockCode || '';
              const templateName = `${stockCode}_${value}档`;
              timeSegmentTemplateFormRef.current?.setFieldsValue({ templateName });
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
      </ModalForm>

      {/* 应用时段配置档位对话框 */}
      <Modal
        title="应用时段配置档位"
        open={timeSegmentApplyTemplateModalVisible}
        onCancel={() => {
          setTimeSegmentApplyTemplateModalVisible(false);
          setSelectedTimeSegmentTemplate(undefined);
          timeSegmentTemplateSearchForm.resetFields();
          setTimeSegmentTemplateSearchParams({
            stockCode: '',
            templateLevel: '',
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
          <Form.Item name="templateLevel" label="档位等级">
            <Select placeholder="请选择档位等级" allowClear style={{ width: 150 }}>
              {timeSegmentTemplateLevels.map(level => (
                <Option key={level.value} value={level.value}>
                  {level.label}
                </Option>
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
                        {template.useScenario && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                            使用场景: {template.useScenario}
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
          <strong>说明：</strong>选择一个时段配置档位后，将其配置应用到当前的时段配置中。
        </div>
      </Modal>

      {/* 批量切换档位模态框 */}
      <Modal
        title="批量切换档位"
        open={batchSwitchTemplateLevelModalVisible}
        onCancel={() => {
          setBatchSwitchTemplateLevelModalVisible(false);
          setSelectedBatchTemplateLevel('');
        }}
        onOk={handleBatchSwitchTemplateLevel}
        confirmLoading={false}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 8 }}>
            已选择 <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{selectedRowKeys.length}</span> 个策略标的
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: 16 }}>
            切换档位将同时更新相关的策略用户股票关系配置
          </div>
          <label style={{ display: 'block', marginBottom: 8 }}>
            档位等级
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择档位等级"
            value={selectedBatchTemplateLevel}
            onChange={setSelectedBatchTemplateLevel}
          >
            {templateLevelOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
      
      {renderBatchSwitchExecutionResultDetail()}
    </>
  );
});

export default StrategyStockList; 