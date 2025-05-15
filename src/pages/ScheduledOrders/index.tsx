import React, { useRef, useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Badge, Tooltip, Space, Tag, Select } from 'antd';
import { listScheduledOrders, cancelScheduledOrder, executeScheduledOrder } from '@/services/ant-design-pro/api';
import { FormattedMessage, useIntl } from '@umijs/max';
import moment from 'moment';

const ScheduledOrdersList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const intl = useIntl();
  
  // 刷新表格
  const refreshTable = () => {
    if (actionRef.current) {
      actionRef.current.reload();
    }
  };

  // 立即执行定时订单
  const handleExecuteNow = async (id: number) => {
    try {
      const result = await executeScheduledOrder(id);
      if (result.success) {
        message.success('订单已提交执行');
        refreshTable();
      } else {
        message.error(`执行失败: ${result.errorMessage || '未知错误'}`);
      }
    } catch (error) {
      message.error('执行订单时发生错误');
    }
  };

  // 取消定时订单
  const handleCancel = async (id: number) => {
    try {
      const result = await cancelScheduledOrder(id);
      if (result.success) {
        message.success('订单已取消');
        refreshTable();
      } else {
        message.error(`取消失败: ${result.errorMessage || '未知错误'}`);
      }
    } catch (error) {
      message.error('取消订单时发生错误');
    }
  };

  // 获取状态标签
  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return <Badge status="processing" text="等待执行" />;
      case 1:
        return <Badge status="success" text="已执行" />;
      case 2:
        return <Badge status="error" text="执行失败" />;
      case 3:
        return <Badge status="default" text="已取消" />;
      case 4:
        return <Badge status="warning" text="处理中" />;
      default:
        return <Badge status="default" text="未知状态" />;
    }
  };

  // 添加操作按钮到操作列
  const renderActionColumn = (_: any, record: API.ScheduledOrder) => {
    // 只有等待执行的订单才能操作
    if (record.status === 0) {
      return [
        <Popconfirm
          key="execute"
          title="确定要立即执行此订单吗？"
          onConfirm={() => handleExecuteNow(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button type="primary" size="small" style={{ marginRight: 4 }}>
            执行
          </Button>
        </Popconfirm>,
        <Popconfirm
          key="cancel"
          title="确定要取消此订单吗？"
          onConfirm={() => handleCancel(record.id)}
          okText="确定"
          cancelText="取消"
        >
          <Button danger size="small">
            取消
          </Button>
        </Popconfirm>,
      ];
    }
    return [];
  };

  // 定义表格列
  const columns: ProColumns<API.ScheduledOrder>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'text',
      width: 60,
      hideInSearch: true,
      fixed: 'left',
    },
    {
      title: '股票代码',
      dataIndex: 'code',
      valueType: 'text',
      width: 90,
      fixed: 'left',
    },
    {
      title: '交易方向',
      dataIndex: 'trdSide',
      valueType: 'select',
      width: 80,
      valueEnum: {
        1: { text: '买入', status: 'success' },
        2: { text: '卖出', status: 'error' },
      },
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      valueType: 'select',
      width: 80,
      hideInSearch: true,
      valueEnum: {
        1: { text: '限价单' },
        2: { text: '市价单' },
      },
    },
    {
      title: '价格',
      dataIndex: 'price',
      valueType: 'money',
      width: 80,
      hideInSearch: true,
      render: (_, record) => {
        return record.orderType === 2 ? '市价' : record.price;
      },
    },
    {
      title: '数量',
      dataIndex: 'number',
      valueType: 'digit',
      width: 70,
      hideInSearch: true,
    },
    {
      title: '交易账号',
      dataIndex: 'accounts',
      valueType: 'text',
      width: 120,
      ellipsis: true,
      render: (_, record) => {
        // 显示多个账号
        if (record.accounts && record.accounts.includes(',')) {
          const accounts = record.accounts.split(',');
          return (
            <Tooltip title={accounts.join(', ')}>
              <div>{accounts.length}个账号</div>
            </Tooltip>
          );
        }
        return record.accounts;
      },
    },
    {
      title: '账号别名',
      dataIndex: 'accountAliases',
      valueType: 'text',
      width: 120,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => {
        if (record.accountAliases) {
          // 如果别名包含逗号分隔符，表示有多个别名
          if (record.accountAliases.includes(',')) {
            const aliases = record.accountAliases.split(',');
            return (
              <Tooltip title={aliases.join(', ')}>
                <span>{aliases.length}个账号别名</span>
              </Tooltip>
            );
          }
          return <span>{record.accountAliases}</span>;
        }
        return '-';
      },
    },
    {
      title: '计划执行时间',
      dataIndex: 'scheduledTime',
      valueType: 'dateTime',
      width: 150,
      sorter: true,
    },
    {
      title: '时区',
      dataIndex: 'timezone',
      valueType: 'select',
      width: 100,
      valueEnum: {
        'America/New_York': { text: '美东时间' },
        'Asia/Shanghai': { text: '北京时间' }
      },
      render: (_, record) => {
        if (record.timezone === 'America/New_York') {
          return '美东时间';
        } else if (record.timezone === 'Asia/Shanghai') {
          return '北京时间';
        }
        return record.timezone || '美东时间';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      width: 100,
      valueEnum: {
        0: { text: '等待执行', status: 'processing' },
        1: { text: '已执行', status: 'success' },
        2: { text: '执行失败', status: 'error' },
        3: { text: '已取消', status: 'default' },
        4: { text: '处理中', status: 'warning' },
      },
      render: (_, record) => getStatusBadge(record.status),
    },
    {
      title: '执行结果',
      dataIndex: 'execResults',
      valueType: 'text',
      width: 150,
      hideInSearch: true,
      ellipsis: true,
      render: (_, record) => {
        if (record.status === 1 || record.status === 2) {
          return <Tooltip title={record.execResults || '-'}>{record.execResults || '-'}</Tooltip>;
        } else if (record.errorMessage) {
          return <Tooltip title={record.errorMessage}><Tag color="red">失败</Tag></Tooltip>;
        }
        return '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 150,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: renderActionColumn
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ScheduledOrder>
        headerTitle="定时订单列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
          defaultCollapsed: true,
          collapseRender: false,
        }}
        scroll={{ x: 1300, y: 500 }}
        request={async (params, sort) => {
          try {
            const response = await listScheduledOrders(params, sort as Record<string, string>);
            console.log('请求结果:', response);
            
            // 确保返回符合 ProTable 要求的格式
            if (!response) return { data: [], success: false };
            
            if (Array.isArray(response)) {
              return {
                data: response,
                success: true,
                total: response.length
              };
            }
            
            // 处理常见的分页数据结构
            if (response.records && Array.isArray(response.records)) {
              return {
                data: response.records,
                success: true,
                total: response.total || response.records.length
              };
            }
            
            // 处理标准响应格式
            if (response.data) {
              return {
                data: Array.isArray(response.data) ? response.data : [],
                success: response.success || true,
                total: response.total || (Array.isArray(response.data) ? response.data.length : 0)
              };
            }
            
            return {
              data: [],
              success: false
            };
          } catch (error) {
            console.error('获取定时订单数据错误:', error);
            return { data: [], success: false };
          }
        }}
        columns={columns}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['20', '50', '100'],
        }}
        size="small"
        options={{
          density: true,
          fullScreen: true,
          reload: true,
        }}
        toolBarRender={() => [
          <Button type="primary" onClick={refreshTable}>
            刷新
          </Button>,
        ]}
      />
    </PageContainer>
  );
};

export default ScheduledOrdersList; 