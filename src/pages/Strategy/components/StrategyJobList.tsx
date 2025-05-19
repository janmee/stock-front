import React, { useImperativeHandle, useRef, forwardRef, useState } from 'react';
import { Button, message, Popconfirm, Select, Tooltip } from 'antd';
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
import { PlusOutlined } from '@ant-design/icons';
import { 
  listStrategyJob, 
  createStrategyJob, 
  updateStrategyJob, 
  deleteStrategyJob 
} from '@/services/ant-design-pro/api';

interface StrategyJobListProps {
  onStrategySelected?: (strategyId: number, strategyName: string) => void;
}

/**
 * 策略任务列表组件
 */
const StrategyJobList = forwardRef((props: StrategyJobListProps, ref) => {
  const { onStrategySelected } = props;
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
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

  // 添加策略任务
  const handleAdd = async (fields: API.StrategyJobItem) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.creating' }));
    
    try {
      await createStrategyJob(fields);
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

  // 删除策略任务
  const handleDelete = async (record: API.StrategyJobItem) => {
    const hide = message.loading(intl.formatMessage({ id: 'pages.message.deleting' }));
    
    try {
      await deleteStrategyJob(record);
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
        <a
          key="select"
          onClick={() => {
            // 通知父组件选择了当前策略
            if (onStrategySelected && record.id) {
              onStrategySelected(record.id, record.name || '');
            }
          }}
        >
          <FormattedMessage id="pages.common.select" defaultMessage="Select" />
        </a>,
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
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            onClick={() => setCreateModalVisible(true)}
          >
            <PlusOutlined /> <FormattedMessage id="pages.common.new" defaultMessage="New" />
          </Button>,
        ]}
        request={listStrategyJob}
        columns={columns}
      />
      
      {/* 新增策略任务表单 */}
      <ModalForm
        title={<FormattedMessage id="pages.strategy.job.create" defaultMessage="Create Strategy Job" />}
        width="550px"
        modalProps={{
          destroyOnClose: true,
        }}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleAdd}
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
          initialValue="Asia/Shanghai"
          rules={[{ required: true }]}
        />
        
        <ProFormSelect
          name="status"
          label={<FormattedMessage id="pages.strategy.job.status" defaultMessage="Status" />}
          valueEnum={{
            '0': <FormattedMessage id="pages.strategy.status.disabled" defaultMessage="Disabled" />,
            '1': <FormattedMessage id="pages.strategy.status.enabled" defaultMessage="Enabled" />,
          }}
          initialValue="1"
          rules={[{ required: true }]}
        />
      </ModalForm>
      
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