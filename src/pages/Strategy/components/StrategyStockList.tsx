import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';
import { Button, message, Popconfirm, Select, Tooltip, Tag, Space, Switch, Input, InputNumber, Form, Modal, Dropdown, Menu } from 'antd';
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
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { PlusOutlined, InfoCircleOutlined, FilterOutlined, CloseCircleOutlined, QuestionCircleOutlined, MinusCircleOutlined, SaveOutlined, ThunderboltOutlined, DownOutlined } from '@ant-design/icons';
import { 
  listStrategyStock, 
  createStrategyStock, 
  updateStrategyStock, 
  deleteStrategyStock,
  listStrategyJob,
  updateStrategyStockStatus,
  updateStrategyStockOpeningBuy,
  batchUpdateStrategyStockOpeningBuy,
  batchUpdateStrategyStockStatus,
  saveConfigTemplate,
  applyConfigTemplate,
  getConfigTemplateList,
  deleteConfigTemplate
} from '@/services/ant-design-pro/api';

interface StrategyStockListProps {
  strategyId?: number;
  strategyName?: string;
  onClearStrategy?: () => void;
  editStockCode?: string;
  onEditComplete?: () => void;
}

/**
 * 策略股票关系列表组件
 */
const StrategyStockList = forwardRef((props: StrategyStockListProps, ref) => {
  const { strategyId, strategyName, onClearStrategy, editStockCode, onEditComplete } = props;
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
  }, []);

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
          <FormattedMessage id="pages.strategy.stock.relation.profitRatio" defaultMessage="Profit Ratio" />
          <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.profitRatioTip" defaultMessage="The profit ratio for take-profit settings" />}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'profitRatio',
      valueType: 'digit',
      hideInSearch: true,
      render: (_, record) => record.profitRatio ? `${(record.profitRatio * 100).toFixed(1)}%` : '-',
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
      render: (_, record) => record.intraDnBelowAvgPercent ? `${(record.intraDnBelowAvgPercent * 100).toFixed(1)}%` : '-',
    },
    {
      title: (
        <>
          <>日内持续下跌时间(分钟)</>
          <Tooltip title="当股票持续下跌达到该时间长度时触发买入信号（如30表示30分钟）">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'intraDnDurationMinutes',
      valueType: 'digit',
      hideInSearch: true,
      render: (_, record) => record.intraDnDurationMinutes ? `${record.intraDnDurationMinutes}分钟` : '-',
    },
    {
      title: (
        <>
          <>日内持续上涨时间(分钟)</>
          <Tooltip title="当股票持续上涨达到该时间长度时触发买入信号（如30表示30分钟）">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'intraUpDurationMinutes',
      valueType: 'digit',
      hideInSearch: true,
      render: (_, record) => record.intraUpDurationMinutes ? `${record.intraUpDurationMinutes}分钟` : '-',
    },
    {
      title: (
        <>
          <FormattedMessage id="pages.strategy.stock.relation.unsoldStackLimit" defaultMessage="Unsold Stack Limit" />
          <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.unsoldStackLimitTip" defaultMessage="Maximum number of open buy orders allowed per day" />}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'unsoldStackLimit',
      valueType: 'digit',
      hideInSearch: true,
    },
    {
      title: (
        <>
          <FormattedMessage id="pages.strategy.stock.relation.totalFundShares" defaultMessage="Total Fund Shares" />
          <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.totalFundSharesTip" defaultMessage="The total number of shares the fund is divided into for buying, default 18" />}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'totalFundShares',
      valueType: 'digit',
      hideInSearch: true,
    },
    {
      title: (
        <>
          <FormattedMessage id="pages.strategy.stock.relation.limitStartShares" defaultMessage="Limit Start Shares" />
          <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.limitStartSharesTip" defaultMessage="From which share to start limiting buying, default 9" />}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'limitStartShares',
      valueType: 'digit',
      hideInSearch: true,
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
      width: 160,
      defaultSortOrder: 'descend',
    },
    {
      title: (
        <>
          <FormattedMessage id="pages.strategy.stock.relation.buyRatioConfig" defaultMessage="Buy Ratio Config" />
          <Tooltip title={<FormattedMessage id="pages.strategy.stock.relation.buyRatioConfigTip" defaultMessage="Configuration for buy ratio of each level" />}>
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'buyRatioConfig',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => {
        if (!record.buyRatioConfig) {
          return '-';
        }
        
        try {
          const config = JSON.parse(record.buyRatioConfig);
          const firstRatio = config.firstShareRatio !== undefined ? `${config.firstShareRatio}%` : '-';
          const extraCount = Array.isArray(config.extraShares) ? config.extraShares.length : 0;
          
          return (
            <Tooltip 
              title={
                <div>
                  <div>前N档: {firstRatio}</div>
                  <div>后续档位: {extraCount}个</div>
                  {Array.isArray(config.extraShares) && config.extraShares.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div>详细配置:</div>
                      {config.extraShares.map((item: any, index: number) => (
                        <div key={index}>
                          档位{index+1}: 跌幅{item.drop}%, 买入{item.ratio}%{item.secondStage ? ', 开启二阶段' : ''}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              }
            >
              <span>前N档: {firstRatio}, 后续: {extraCount}个档位</span>
            </Tooltip>
          );
        } catch (error) {
          return '-';
        }
      },
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
  
  // 处理自动编辑逻辑
  useEffect(() => {
    if (editStockCode && strategyId) {
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
            // 转换数据格式
            const editItem = {
              ...targetRecord,
              profitRatio: targetRecord.profitRatio ? targetRecord.profitRatio * 100 : undefined,
              levelPercent: targetRecord.levelPercent ? targetRecord.levelPercent * 100 : undefined,
              maBelowPercent: targetRecord.maBelowPercent ? targetRecord.maBelowPercent * 100 : undefined,
              maAbovePercent: targetRecord.maAbovePercent ? targetRecord.maAbovePercent * 100 : undefined,
              intraUpPullbackPercent: targetRecord.intraUpPullbackPercent ? targetRecord.intraUpPullbackPercent * 100 : undefined,
              intraDnBelowAvgPercent: targetRecord.intraDnBelowAvgPercent ? targetRecord.intraDnBelowAvgPercent * 100 : undefined,
            };
            
            setCurrentRow(editItem);
            setUpdateModalVisible(true);
            message.success(`已自动打开股票 ${editStockCode} 的编辑弹窗`);
          } else {
            message.warning(`未找到策略下的股票 ${editStockCode} 的配置，请先在策略标的中添加该股票`);
          }
        } catch (error) {
          console.error('自动打开编辑弹窗失败:', error);
          message.error('自动打开编辑弹窗失败');
        } finally {
          // 无论成功失败都通知父组件编辑完成，清除URL参数
          if (onEditComplete) {
            onEditComplete();
          }
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [editStockCode, strategyId, onEditComplete]);
  
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
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
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
            批量状态
          </Dropdown.Button>,
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
              
              return {
                data: processedData,
                success: true,
                total: response.total || processedData.length
              };
            }
            return {
              data: [],
              success: false,
              total: 0
            };
          });
        }}
        columns={columns}
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
              }
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
        <div style={{ marginBottom: 16 }}>
          <strong>选择模版：</strong>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {templates.map((template) => (
            <div
              key={template.id}
              style={{
                border: selectedTemplate === template.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: 4,
                padding: 12,
                marginBottom: 8,
                cursor: 'pointer',
                backgroundColor: selectedTemplate === template.id ? '#f0f8ff' : 'white',
              }}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{template.name}</div>
                  {template.applicableScenario && (
                    <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                      {template.applicableScenario}
                    </div>
                  )}
                  {template.marketCondition && (
                    <div style={{ color: '#1890ff', fontSize: 12, marginTop: 2 }}>
                      行情: {template.marketCondition}
                    </div>
                  )}
                  {template.volatilityRange && (
                    <div style={{ color: '#52c41a', fontSize: 12, marginTop: 2 }}>
                      波动范围: {template.volatilityRange}
                    </div>
                  )}
                  {template.strategyId && (
                    <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                      策略ID: {template.strategyId}
                    </div>
                  )}
                  {template.sourceStockCode && (
                    <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                      来源股票: {template.sourceStockCode}
                    </div>
                  )}
                  {(template.minMarketCap || template.maxMarketCap) && (
                    <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>
                      市值范围: {template.minMarketCap || 0} - {template.maxMarketCap || '∞'} 亿美元
                    </div>
                  )}
                  <div style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
                    创建时间: {template.createTime}
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    Modal.confirm({
                      title: '确认删除',
                      content: '确定要删除这个模版吗？',
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
        {templates.length === 0 && (
          <div style={{ textAlign: 'center', color: '#999', padding: 20 }}>
            暂无模版
          </div>
        )}
        <div style={{ marginTop: 16, color: '#666', fontSize: 12 }}>
          <strong>说明：</strong>选择一个模版后，将其配置应用到当前选中的 {selectedRowKeys.length} 个目标配置中。
        </div>
      </Modal>
    </>
  );
});

export default StrategyStockList; 