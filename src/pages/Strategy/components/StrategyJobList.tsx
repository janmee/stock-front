import React, { useImperativeHandle, useRef, forwardRef, useState } from 'react';
import { message, Switch } from 'antd';
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
  executeStrategyJob
} from '@/services/ant-design-pro/api';

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
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  
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
        <span key="status-wrapper" style={{ display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ marginRight: 4 }}>
            <FormattedMessage id="pages.common.status" defaultMessage="状态" />:
          </span>
          <Switch
            key="status"
            checked={record.status === '1'}
            onChange={(checked) => handleToggleStatus(record, checked)}
            checkedChildren={<FormattedMessage id="pages.common.enabled" defaultMessage="启用" />}
            unCheckedChildren={<FormattedMessage id="pages.common.disabled" defaultMessage="禁用" />}
            size="small"
            title={record.status === '1' ? '点击禁用' : '点击启用'}
            loading={record.running === '1'}
          />
        </span>,
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
        onFinish={handleUpdate}
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
          name="status"
          label={<FormattedMessage id="pages.strategy.job.status" defaultMessage="Status" />}
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

export default StrategyJobList; 