import React, { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react';
import { Button, message, Popconfirm, Select, Tooltip, Tag, Space } from 'antd';
import {
  ActionType,
  ModalForm,
  PageContainer,
  ProColumns,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { PlusOutlined, InfoCircleOutlined, FilterOutlined, CloseCircleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { 
  listStrategyStock, 
  createStrategyStock, 
  updateStrategyStock, 
  deleteStrategyStock,
  listStrategyJob
} from '@/services/ant-design-pro/api';

interface StrategyStockListProps {
  strategyId?: number;
  strategyName?: string;
  onClearStrategy?: () => void;
}

/**
 * 策略股票关系列表组件
 */
const StrategyStockList = forwardRef((props: StrategyStockListProps, ref) => {
  const { strategyId, strategyName, onClearStrategy } = props;
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.StrategyStockItem>();
  const [strategyOptions, setStrategyOptions] = useState<{label: string, value: number}[]>([]);
  const actionRef = useRef<ActionType>();
  const createFormRef = useRef<any>();
  const updateFormRef = useRef<any>();
  const intl = useIntl();
  
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

  // 添加策略股票关系
  const handleAdd = async (fields: API.StrategyStockItem) => {
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
    
    // 确保有默认值
    fields.unsoldStackLimit = fields.unsoldStackLimit || 4;
    fields.totalFundShares = fields.totalFundShares || 18;
    fields.limitStartShares = fields.limitStartShares || 9;
    
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
  const handleUpdate = async (fields: API.StrategyStockItem) => {
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
    
    // 确保有默认值
    fields.unsoldStackLimit = fields.unsoldStackLimit || currentRow.unsoldStackLimit || 4;
    fields.totalFundShares = fields.totalFundShares || currentRow.totalFundShares || 18;
    fields.limitStartShares = fields.limitStartShares || currentRow.limitStartShares || 9;
    
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
      width: 120,
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
      width: 150,
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
      width: 150,
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
      width: 140,
      render: (_, record) => record.levelPercent ? `${(record.levelPercent * 100).toFixed(1)}%` : '-',
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
      width: 140,
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
      width: 140,
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
      width: 140,
    },
    {
      title: <FormattedMessage id="pages.strategy.stock.relation.status" defaultMessage="Status" />,
      dataIndex: 'status',
      valueEnum: {
        '0': <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
        '1': <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
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
  
  return (
    <>
      {renderFilterTag()}
      
      <ProTable<API.StrategyStockItem, API.PageParams>
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            <PlusOutlined /> <FormattedMessage id="pages.common.new" defaultMessage="New" />
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
        width="550px"
        formRef={createFormRef}
        modalProps={{
          destroyOnClose: true,
        }}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleAdd}
      >
        {!strategyId && (
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
        )}
        
        {!strategyId && (
          <ProFormText
            name="strategyName"
            label={<FormattedMessage id="pages.strategy.job.name" defaultMessage="Strategy Name" />}
            rules={[{ required: true }]}
            hidden
          />
        )}
        
        <ProFormText
          name="stockCode"
          label={<FormattedMessage id="pages.strategy.stock.relation.stockCode" defaultMessage="Stock Code" />}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="profitRatio"
          label={<FormattedMessage id="pages.strategy.stock.relation.profitRatio" defaultMessage="Profit Ratio (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.profitRatioTip" defaultMessage="The profit ratio for take-profit settings (in percentage, e.g. 10 means 10%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.1,
            precision: 1,
            addonAfter: '%',
          }}
          initialValue={1}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="maBelowPercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercent" defaultMessage="MA Below Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercentTip" defaultMessage="Buy when price is below moving average by this percentage (in percentage, e.g. 3 means 3%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.1,
            precision: 1,
            addonAfter: '%',
          }}
          initialValue={1}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="maAbovePercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercent" defaultMessage="MA Above Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercentTip" defaultMessage="Buy when price is above moving average by this percentage (in percentage, e.g. 0.2 means 0.2%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.1,
            precision: 1,
            addonAfter: '%',
          }}
          initialValue={0.2}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="levelPercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.levelPercent" defaultMessage="Level Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.levelPercentTip" defaultMessage="Level percentage for stock trading (in percentage, e.g. 1.5 means 1.5%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.1,
            precision: 1,
            addonAfter: '%',
          }}
          initialValue={1.5}
          rules={[{ required: true }]}
        />
        
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
        
        <ProFormDigit
          name="totalFundShares"
          label={<FormattedMessage id="pages.strategy.stock.relation.totalFundShares" defaultMessage="Total Fund Shares" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.totalFundSharesTip" defaultMessage="The total number of shares the fund is divided into for buying, default 18" />}
          min={1}
          max={100}
          fieldProps={{
            step: 1,
            precision: 0,
          }}
          initialValue={18}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="limitStartShares"
          label={<FormattedMessage id="pages.strategy.stock.relation.limitStartShares" defaultMessage="Limit Start Shares" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.limitStartSharesTip" defaultMessage="From which share to start limiting buying, default 9" />}
          min={1}
          max={100}
          fieldProps={{
            step: 1,
            precision: 0,
          }}
          initialValue={9}
          rules={[{ required: true }]}
        />
        
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
      </ModalForm>
      
      {/* 编辑策略股票关系表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.stock.relation.edit" defaultMessage="Edit Strategy Stock Relation" />}
        width="550px"
        formRef={updateFormRef}
        modalProps={{
          destroyOnClose: true,
        }}
        open={updateModalVisible}
        onOpenChange={setUpdateModalVisible}
        onFinish={handleUpdate}
        initialValues={currentRow}
      >
        <ProFormText
          name="stockCode"
          label={<FormattedMessage id="pages.strategy.stock.relation.stockCode" defaultMessage="Stock Code" />}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="profitRatio"
          label={<FormattedMessage id="pages.strategy.stock.relation.profitRatio" defaultMessage="Profit Ratio (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.profitRatioTip" defaultMessage="The profit ratio for take-profit settings (in percentage, e.g. 10 means 10%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.1,
            precision: 1,
            addonAfter: '%',
          }}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="maBelowPercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercent" defaultMessage="MA Below Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.maBelowPercentTip" defaultMessage="Buy when price is below moving average by this percentage (in percentage, e.g. 3 means 3%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.1,
            precision: 1,
            addonAfter: '%',
          }}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="maAbovePercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercent" defaultMessage="MA Above Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.maAbovePercentTip" defaultMessage="Buy when price is above moving average by this percentage (in percentage, e.g. 0.2 means 0.2%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.1,
            precision: 1,
            addonAfter: '%',
          }}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="levelPercent"
          label={<FormattedMessage id="pages.strategy.stock.relation.levelPercent" defaultMessage="Level Percent (%)" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.levelPercentTip" defaultMessage="Level percentage for stock trading (in percentage, e.g. 1.5 means 1.5%)" />}
          min={0}
          max={100}
          fieldProps={{
            step: 0.1,
            precision: 1,
            addonAfter: '%',
          }}
          rules={[{ required: true }]}
        />
        
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
        
        <ProFormDigit
          name="totalFundShares"
          label={<FormattedMessage id="pages.strategy.stock.relation.totalFundShares" defaultMessage="Total Fund Shares" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.totalFundSharesTip" defaultMessage="The total number of shares the fund is divided into for buying, default 18" />}
          min={1}
          max={100}
          fieldProps={{
            step: 1,
            precision: 0,
          }}
          initialValue={18}
          rules={[{ required: true }]}
        />
        
        <ProFormDigit
          name="limitStartShares"
          label={<FormattedMessage id="pages.strategy.stock.relation.limitStartShares" defaultMessage="Limit Start Shares" />}
          tooltip={<FormattedMessage id="pages.strategy.stock.relation.limitStartSharesTip" defaultMessage="From which share to start limiting buying, default 9" />}
          min={1}
          max={100}
          fieldProps={{
            step: 1,
            precision: 0,
          }}
          initialValue={9}
          rules={[{ required: true }]}
        />
        
        <ProFormSelect
          name="status"
          label={<FormattedMessage id="pages.strategy.stock.relation.status" defaultMessage="Status" />}
          valueEnum={{
            '0': <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
            '1': <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
          }}
          rules={[{ required: true }]}
        />
      </ModalForm>
    </>
  );
});

export default StrategyStockList; 