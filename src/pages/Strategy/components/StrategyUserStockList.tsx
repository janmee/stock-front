import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';
import { Button, message, Popconfirm, Space, Tag, Tooltip, Switch, Select, DatePicker, Modal, Checkbox } from 'antd';
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
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { PlusOutlined, InfoCircleOutlined, FilterOutlined, CloseCircleOutlined, QuestionCircleOutlined, SaveOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { 
  listStrategyUserStock, 
  createStrategyUserStock, 
  updateStrategyUserStock, 
  deleteStrategyUserStock,
  listAccount,
  listStrategyJob,
  updateStrategyUserStockStatus,
  updateStrategyUserStockSecondStage,
  updateStrategyUserStockOpeningBuy,
  saveConfigTemplate,
  applyConfigTemplate,
  getConfigTemplateList,
  deleteConfigTemplate
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
  const actionRef = useRef<ActionType>();
  const createFormRef = useRef<any>();
  const updateFormRef = useRef<any>();
  const saveTemplateFormRef = useRef<any>();
  const intl = useIntl();
  
  // 公开刷新方法
  useImperativeHandle(ref, () => ({
    reload: () => {
      actionRef.current?.reload();
    },
  }));

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
      render: (_, record) => record.maxAmount ? `$${record.maxAmount.toFixed(0)}` : '-',
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
      
      <ProTable<API.StrategyUserStockItem, API.PageParams>
        actionRef={actionRef}
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
              return {
                data: response.data,
                success: true,
                total: response.total || response.data.length
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
      
      {/* 新增策略用户股票关系表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.user.stockRelation.create" defaultMessage="Create Strategy User Stock Relation" />}
        width="650px"
        formRef={createFormRef}
        modalProps={{
          destroyOnClose: true,
        }}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleAdd}
      >
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
        }}
        open={updateModalVisible}
        onOpenChange={setUpdateModalVisible}
        onFinish={handleUpdate}
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
    </>
  );
});

export default StrategyUserStockList; 