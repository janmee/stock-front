import React, { useRef } from 'react';
import { Button, message, Tooltip } from 'antd';
import {
  ActionType,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  listAccountFundAllocation
} from '@/services/ant-design-pro/api';

/**
 * 账户资金配比组件
 * 展示账户的资金配比信息，包括配置股票数量、资金占比等
 */
const AccountFundAllocation: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const columns: ProColumns<API.AccountInfo>[] = [
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.accountFundAllocation.accountName" defaultMessage="账户名称" />
          <Tooltip title={intl.formatMessage({ id: 'pages.strategy.accountFundAllocation.accountName.tooltip', defaultMessage: '账户的显示名称' })}>
            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'name',
      width: 120,
      fixed: 'left',
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.accountFundAllocation.account" defaultMessage="账户号" />
          <Tooltip title={intl.formatMessage({ id: 'pages.strategy.accountFundAllocation.account.tooltip', defaultMessage: '账户的唯一标识号' })}>
            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'account',
      width: 120,
      fixed: 'left',
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.accountFundAllocation.totalAmount" defaultMessage="总资金" />
          <Tooltip title={intl.formatMessage({ id: 'pages.strategy.accountFundAllocation.totalAmount.tooltip', defaultMessage: '账户的总资金额度' })}>
            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'totalAmount',
      width: 120,
      sorter: true,
      defaultSortOrder: 'descend',
      render: (_, record) => {
        const amount = record.totalAmount || 0;
        return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    },
    
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.accountFundAllocation.singleFundAmount" defaultMessage="单次资金" />
          <Tooltip title={intl.formatMessage({ id: 'pages.strategy.accountFundAllocation.singleFundAmount.tooltip', defaultMessage: '每次买入的资金额度总和及其占比' })}>
            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'singleFundAmount',
      width: 180,
      render: (_, record) => {
        const amount = record.singleFundAmount || 0;
        const totalAmount = record.totalAmount || 0;
        const ratio = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
        const color = ratio > 20 ? '#ff4d4f' : ratio > 10 ? '#faad14' : '#52c41a';
        return (
          <div>
            <div>${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ color, fontSize: '12px' }}>({ratio.toFixed(2)}%)</div>
          </div>
        );
      },
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.accountFundAllocation.totalDailyMaxHolding" defaultMessage="每天最大持有资金" />
          <Tooltip title={intl.formatMessage({ id: 'pages.strategy.accountFundAllocation.totalDailyMaxHolding.tooltip', defaultMessage: '每天最大持有资金总和及其占比' })}>
            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'totalDailyMaxHolding',
      width: 180,
      render: (_, record) => {
        const amount = record.totalDailyMaxHolding || 0;
        const ratio = record.dailyMaxHoldingRatio || 0;
        const color = ratio > 80 ? '#ff4d4f' : ratio > 60 ? '#faad14' : '#52c41a';
        return (
          <div>
            <div>${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ color, fontSize: '12px' }}>({ratio.toFixed(2)}%)</div>
          </div>
        );
      },
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.accountFundAllocation.totalMaxHolding" defaultMessage="最大持有资金" />
          <Tooltip title={intl.formatMessage({ id: 'pages.strategy.accountFundAllocation.totalMaxHolding.tooltip', defaultMessage: '最大持有资金总和及其占比' })}>
            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'totalMaxHolding',
      width: 180,
      render: (_, record) => {
        const amount = record.totalMaxHolding || 0;
        const ratio = record.maxHoldingRatio || 0;
        const color = ratio > 90 ? '#ff4d4f' : ratio > 70 ? '#faad14' : '#52c41a';
        return (
          <div>
            <div>${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div style={{ color, fontSize: '12px' }}>({ratio.toFixed(2)}%)</div>
          </div>
        );
      },
    },
    {
      title: (
        <span>
          <FormattedMessage id="pages.strategy.accountFundAllocation.stockCount" defaultMessage="配置股票数量" />
          <Tooltip title={intl.formatMessage({ id: 'pages.strategy.accountFundAllocation.stockCount.tooltip', defaultMessage: '该账户配置的股票数量' })}>
            <InfoCircleOutlined style={{ marginLeft: 4, color: '#1890ff' }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'stockCount',
      width: 120,
      render: (_, record) => {
        const count = record.stockCount || 0;
        return <span style={{ color: count > 0 ? '#52c41a' : '#999' }}>{count}</span>;
      },
    },
  ];

  return (
    <ProTable<API.AccountInfo>
      headerTitle={
        <FormattedMessage 
          id="pages.strategy.accountFundAllocation.title" 
          defaultMessage="账户资金配比" 
        />
      }
      actionRef={actionRef}
      rowKey="id"
      search={false}
      request={async (params, sort) => {
        try {
          const response = await listAccountFundAllocation(params, sort);
          return {
            data: response.data || [],
            success: response.success,
            total: response.total || 0,
          };
        } catch (error) {
          message.error(intl.formatMessage({ 
            id: 'pages.strategy.accountFundAllocation.fetchError', 
            defaultMessage: '获取账户资金配比失败' 
          }));
          return {
            data: [],
            success: false,
            total: 0,
          };
        }
      }}
      columns={columns}
      scroll={{ x: 1400 }}
      pagination={{
        defaultPageSize: 100,
        showSizeChanger: false,
        showQuickJumper: false,
        hideOnSinglePage: true,
        showTotal: (total, range) =>
          intl.formatMessage(
            { id: 'pages.common.table.total', defaultMessage: '第 {start}-{end} 条/总共 {total} 条' },
            { start: range[0], end: range[1], total }
          ),
      }}
      toolBarRender={() => [
        <Button
          key="refresh"
          icon={<ReloadOutlined />}
          onClick={() => {
            actionRef.current?.reload();
          }}
        >
          <FormattedMessage id="pages.common.refresh" defaultMessage="刷新" />
        </Button>,
      ]}
    />
  );
};

export default AccountFundAllocation; 