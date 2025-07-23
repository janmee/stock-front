import React, { useImperativeHandle, useRef, forwardRef, useState } from 'react';
import { message, Switch, Button, Modal, Select, Tag, Descriptions, Card, Alert } from 'antd';
import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { 
  listStrategyJob, 
  updateStrategyJob, 
  executeStrategyJob,
  switchStrategyJobTemplateLevel
} from '@/services/ant-design-pro/api';

const { Option } = Select;

// 档位等级选项
const templateLevelOptions = [
  { value: 'S', label: 'S档位' },
  { value: 'A', label: 'A档位' },
  { value: 'B', label: 'B档位' },
  { value: 'C', label: 'C档位' },
];

interface StrategyJobListProps {
  onStrategySelected?: (strategyId: number, strategyName: string) => void;
}

/**
 * 策略任务列表组件
 */
const StrategyJobList = forwardRef((props: StrategyJobListProps, ref) => {
  const { onStrategySelected } = props;
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.StrategyJobItem>();
  const [switchTemplateLevelModalVisible, setSwitchTemplateLevelModalVisible] = useState<boolean>(false);
  const [switchingRecord, setSwitchingRecord] = useState<API.StrategyJobItem>();
  const [selectedTemplateLevel, setSelectedTemplateLevel] = useState<string>('');
  const [resultDetailModalVisible, setResultDetailModalVisible] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<API.TemplateLevelApplyResult | null>(null);
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  
  // 档位等级选项
  const templateLevelOptions = [
    { value: 'A', label: 'A档位' },
    { value: 'B', label: 'B档位' },
    { value: 'C', label: 'C档位' },
    { value: 'D', label: 'D档位' },
    { value: 'S', label: 'S档位' },
  ];
  
  // 公开刷新方法
  useImperativeHandle(ref, () => ({
    reload: () => {
      actionRef.current?.reload();
    },
  }));

  // 更新策略任务
  const handleUpdate = async (fields: API.StrategyJobItem) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.updating' }));
    
    if (!currentRow) {
      return false;
    }
    
    console.log('提交前检查 - currentRow:', currentRow);
    console.log('提交前检查 - fields:', fields);
    console.log('提交前检查 - 合并后数据:', {...currentRow, ...fields});
    
    try {
      await updateStrategyJob({
        ...currentRow,
        ...fields,
      });
      hide();
      message.success(intl.formatMessage({ id: 'pages.message.updated' }));
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      console.error('更新策略任务出错:', error);
      message.error(intl.formatMessage({ id: 'pages.message.updateFailed' }));
      return false;
    }
  };

  // 执行策略任务
  const handleExecute = async (record: API.StrategyJobItem) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.executing' }, { defaultMessage: '正在执行...' }));
    
    try {
      await executeStrategyJob(record.id!);
      hide();
      message.success(intl.formatMessage({ id: 'pages.message.executed' }, { defaultMessage: '执行成功！' }));
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(intl.formatMessage({ id: 'pages.message.executeFailed' }, { defaultMessage: '执行失败！' }));
      return false;
    }
  };

  // 启用/禁用策略任务
  const handleToggleStatus = async (record: API.StrategyJobItem, checked: boolean) => {
    const newStatus = checked ? '1' : '0';
    const action = checked ? '启用' : '禁用';
    const hide = message.loading(`正在${action}...`);
    
    try {
      await updateStrategyJob({
        ...record,
        status: newStatus,
      });
      hide();
      message.success(`${action}成功！`);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error(`${action}失败！`);
      return false;
    }
  };

  // 切换档位
  const handleSwitchTemplateLevel = async () => {
    if (!switchingRecord || !selectedTemplateLevel) {
      message.error('请选择档位等级');
      return;
    }
    
    const hide = message.loading('正在切换档位...');
    try {
      const response = await switchStrategyJobTemplateLevel(switchingRecord.id!, selectedTemplateLevel);
      hide();
      
      if (response && response.success && response.data) {
        const result = response.data;
        setExecutionResult(result);
        
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
              onClick={() => setResultDetailModalVisible(true)}
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
        message.success('档位切换成功！');
      }
      
      setSwitchTemplateLevelModalVisible(false);
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('档位切换失败！');
      return false;
    }
  };

  // 渲染执行结果详情
  const renderExecutionResultDetail = () => {
    if (!executionResult) return null;

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
        title="档位切换执行结果详情"
        open={resultDetailModalVisible}
        onCancel={() => setResultDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultDetailModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={800}
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <Alert
            type={getStatusColor(executionResult.status)}
            message={executionResult.statusMessage}
            description={executionResult.detailMessage}
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Card title="执行统计" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="总处理数量">
                {executionResult.totalProcessCount}
              </Descriptions.Item>
              <Descriptions.Item label="成功数量">
                <span style={{ color: '#52c41a' }}>{executionResult.totalSuccessCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="未配置数量">
                <span style={{ color: '#ff4d4f' }}>{executionResult.totalNoConfigCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="成功率">
                {executionResult.totalProcessCount > 0 
                  ? `${((executionResult.totalSuccessCount / executionResult.totalProcessCount) * 100).toFixed(1)}%`
                  : '0%'
                }
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="策略标的统计" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="总数量">
                {executionResult.strategyStockTotalCount}
              </Descriptions.Item>
              <Descriptions.Item label="成功数量">
                <span style={{ color: '#52c41a' }}>{executionResult.strategyStockSuccessCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="未配置数量">
                <span style={{ color: '#ff4d4f' }}>{executionResult.strategyStockNoConfigCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="成功率">
                {executionResult.strategyStockTotalCount > 0 
                  ? `${((executionResult.strategyStockSuccessCount / executionResult.strategyStockTotalCount) * 100).toFixed(1)}%`
                  : '0%'
                }
              </Descriptions.Item>
            </Descriptions>
            
            {executionResult.strategyStockNoConfigList && executionResult.strategyStockNoConfigList.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginBottom: 8, color: '#ff4d4f' }}>未找到配置的策略标的：</h4>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 8 }}>
                  {executionResult.strategyStockNoConfigList.map((item, index) => (
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
                {executionResult.strategyUserStockTotalCount}
              </Descriptions.Item>
              <Descriptions.Item label="成功数量">
                <span style={{ color: '#52c41a' }}>{executionResult.strategyUserStockSuccessCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="未配置数量">
                <span style={{ color: '#ff4d4f' }}>{executionResult.strategyUserStockNoConfigCount}</span>
              </Descriptions.Item>
              <Descriptions.Item label="成功率">
                {executionResult.strategyUserStockTotalCount > 0 
                  ? `${((executionResult.strategyUserStockSuccessCount / executionResult.strategyUserStockTotalCount) * 100).toFixed(1)}%`
                  : '0%'
                }
              </Descriptions.Item>
            </Descriptions>
            
            {executionResult.strategyUserStockNoConfigList && executionResult.strategyUserStockNoConfigList.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <h4 style={{ marginBottom: 8, color: '#ff4d4f' }}>未找到配置的策略用户股票关系：</h4>
                <div style={{ maxHeight: '120px', overflowY: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 8 }}>
                  {executionResult.strategyUserStockNoConfigList.map((item, index) => (
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

  // 表格列定义
  const columns: ProColumns<API.StrategyJobItem>[] = [
    {
      title: <FormattedMessage id="pages.strategy.job.id" defaultMessage="ID" />,
      dataIndex: 'id',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.strategy.job.name" defaultMessage="Name" />,
      dataIndex: 'name',
      valueType: 'text',
    },
    {
      title: <FormattedMessage id="pages.strategy.job.description" defaultMessage="Description" />,
      dataIndex: 'description',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.strategy.job.className" defaultMessage="Class Name" />,
      dataIndex: 'className',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => {
        const parts = record.className?.split('.') || [];
        return parts.length > 0 ? `...${parts[parts.length - 1]}` : record.className;
      },
    },
    {
      title: <FormattedMessage id="pages.strategy.job.cron" defaultMessage="Cron Expression" />,
      dataIndex: 'cron',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.strategy.job.endTime" defaultMessage="End Time" />,
      dataIndex: 'endTime',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => (
        <span>{record.endTime || '16:00'}</span>
      ),
    },
    {
      title: <FormattedMessage id="pages.strategy.job.status" defaultMessage="Status" />,
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
    },
    {
      title: <FormattedMessage id="pages.strategy.job.running" defaultMessage="Running" />,
      dataIndex: 'running',
      valueEnum: {
        '0': {
          text: <FormattedMessage id="pages.strategy.running.no" defaultMessage="No" />,
          status: 'Default',
        },
        '1': {
          text: <FormattedMessage id="pages.strategy.running.yes" defaultMessage="Yes" />,
          status: 'Processing',
        },
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.strategy.createTime" defaultMessage="Create Time" />,
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '档位',
      dataIndex: 'templateLevel',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => (
        <Tag color={record.templateLevel === 'S' ? 'red' : record.templateLevel === 'A' ? 'green' : 'blue'}>
          {record.templateLevel ? `${record.templateLevel}档位` : '未设置'}
        </Tag>
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
            setCurrentRow(record);
            setUpdateModalVisible(true);
          }}
          style={{ marginRight: 8 }}
        >
          <FormattedMessage id="pages.common.edit" defaultMessage="Edit" />
        </a>,
        <a
          key="execute"
          onClick={() => handleExecute(record)}
          style={{ marginRight: 8 }}
        >
          <FormattedMessage id="pages.common.execute" defaultMessage="Execute" />
        </a>,
        <Button
          key="switch-level"
          type="link"
          onClick={() => {
            setSwitchingRecord(record);
            setSelectedTemplateLevel(record.templateLevel || '');
            setSwitchTemplateLevelModalVisible(true);
          }}
          style={{ marginRight: 8 }}
        >
          切换档位
        </Button>,
        <Switch
          key="status"
          checked={record.status === '1'}
          onChange={(checked) => handleToggleStatus(record, checked)}
          checkedChildren={<FormattedMessage id="pages.common.enabled" defaultMessage="启用" />}
          unCheckedChildren={<FormattedMessage id="pages.common.disabled" defaultMessage="禁用" />}
          size="small"
          title={record.status === '1' ? '点击禁用' : '点击启用'}
        />,
      ],
    },
  ];
  
  return (
    <>
      <ProTable<API.StrategyJobItem, API.PageParams>
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => []}
        request={listStrategyJob}
        columns={columns}
      />
      
      {/* 编辑策略任务表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.job.edit" defaultMessage="Edit Strategy Job" />}
        width="550px"
        modalProps={{
          destroyOnClose: true,
        }}
        open={updateModalVisible}
        onOpenChange={setUpdateModalVisible}
        onFinish={async (values) => {
          console.log('Form values before submit:', values);
          // 确保endTime字段存在且正确命名
          const formattedValues = {
            ...values,
            endTime: values.endTime || '16:00', // 如果为空则使用默认值
          };
          console.log('格式化后的表单数据:', formattedValues);
          return handleUpdate(formattedValues);
        }}
        initialValues={currentRow}
      >
        <ProFormText
          name="name"
          label={<FormattedMessage id="pages.strategy.job.name" defaultMessage="Name" />}
          rules={[{ required: true }]}
        />
        
        <ProFormTextArea
          name="description"
          label={<FormattedMessage id="pages.strategy.job.description" defaultMessage="Description" />}
        />
        
        <ProFormText
          name="className"
          label={<FormattedMessage id="pages.strategy.job.className" defaultMessage="Class Name" />}
          rules={[{ required: true }]}
        />
        
        <ProFormText
          name="cron"
          label={<FormattedMessage id="pages.strategy.job.cron" defaultMessage="Cron Expression" />}
          rules={[{ required: true }]}
        />
        
        <ProFormSelect
          name="timeZone"
          label={<FormattedMessage id="pages.strategy.job.timeZone" defaultMessage="Time Zone" />}
          valueEnum={{
            'Asia/Shanghai': <FormattedMessage id="pages.job.timeZone.shanghai" defaultMessage="Beijing (CST)" />,
            'America/New_York': <FormattedMessage id="pages.job.timeZone.newyork" defaultMessage="Eastern US (EDT/EST)" />,
          }}
          rules={[{ required: true }]}
        />
        
        <ProFormSelect
          name="endTime"
          label={<FormattedMessage id="pages.strategy.job.endTime" defaultMessage="End Time" />}
          placeholder="选择策略每日结束运行时间"
          rules={[{ required: true, message: '请选择结束运行时间' }]}
          allowClear={false}
          showSearch
          options={[
            // 生成从00:00到16:00，每半小时一个选项
            ...[...Array(33)].map((_, index) => {
              const hour = Math.floor(index / 2);
              const minute = (index % 2) * 30;
              const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
              return { label: timeString, value: timeString };
            })
          ]}
        />
        
        <ProFormSelect
          name="status"
          label={<FormattedMessage id="pages.strategy.job.status" defaultMessage="Status" />}
          valueEnum={{
            '0': <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
            '1': <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
          }}
          rules={[{ required: true }]}
        />
      </ModalForm>

      {/* 切换档位模态框 */}
      <Modal
        title="切换档位"
        open={switchTemplateLevelModalVisible}
        onCancel={() => setSwitchTemplateLevelModalVisible(false)}
        onOk={handleSwitchTemplateLevel}
        confirmLoading={false}
        okText="确定"
        cancelText="取消"
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            档位等级
          </label>
          <Select
            style={{ width: '100%' }}
            placeholder="请选择档位等级"
            value={selectedTemplateLevel}
            onChange={setSelectedTemplateLevel}
          >
            {templateLevelOptions.map(option => (
              <Option key={option.value} value={option.value}>
                {option.label}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>
      {renderExecutionResultDetail()}
    </>
  );
});

export default StrategyJobList; 