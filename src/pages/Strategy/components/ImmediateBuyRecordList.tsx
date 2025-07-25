import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { ProTable, ActionType, ProColumns } from '@ant-design/pro-table';
import { Button, message, Tag, Space, Card, Tooltip, Modal } from 'antd';
import { ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import { immediateBuyRecordService } from '../../../services/immediateBuyRecord';

interface ImmediateBuyRecord {
  id: number;
  strategyId: number;
  strategyName: string;
  stockCode: string;
  account: string;
  accountName: string;
  buyType: string;
  fundPercent: number;
  fixedAmount: number;
  profitRatio: number;
  buyReason: string;
  stockPrice: number;
  buyQuantity: number;
  buyAmount: number;
  orderId: string;
  orderNo: string;
  orderStatus: number;
  orderStatusName: string;
  canCancel: boolean;
  fillQty: number;
  fillAvgPrice: number;
  fillAmount: number;
  sellOrderNo: string;
  sellOrderStatus: number;
  sellOrderStatusName: string;
  profitAmount: number;
  buyStatus: string;
  failureReason: string;
  extraInfo: string;
  createTime: string;
  updateTime: string;
}

interface QueryParams {
  current?: number;
  pageSize?: number;
  strategyId?: number;
  strategyName?: string;
  stockCode?: string;
  account?: string;
  accountName?: string;
  buyType?: string;
  buyStatus?: string;
  startDate?: string;
  endDate?: string;
  sortKey?: string;
  sortOrder?: string;
}

const ImmediateBuyRecordList = forwardRef<{ reload: () => void }, {}>((props, ref) => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [accountOptions, setAccountOptions] = useState<{label: string, value: string}[]>([]);

  // 暴露reload方法给父组件
  useImperativeHandle(ref, () => ({
    reload: () => {
      actionRef.current?.reload();
    },
  }));

  // 加载账户选项
  useEffect(() => {
    const fetchAccountOptions = async () => {
      try {
        // 使用和策略用户股票关系相同的API
        const { listAccount } = await import('@/services/ant-design-pro/api');
        const accountResponse = await listAccount();
        if (accountResponse.success && accountResponse.data) {
          const options = accountResponse.data.map((account: any) => ({
            label: account.name || account.account,
            value: account.account,
          }));
          setAccountOptions(options);
        }
      } catch (error) {
        console.error('获取账户选项失败:', error);
      }
    };

    fetchAccountOptions();
  }, []);

  // 获取买入记录列表（包含订单状态）
  const fetchImmediateBuyRecords = async (params: QueryParams) => {
    try {
      const response = await immediateBuyRecordService.pageWithOrderStatus({
        current: params.current || 1,
        pageSize: params.pageSize || 20,
        ...params,
      });
      
      if (response.success) {
        return {
          data: response.data || [],
          total: response.total || 0,
          success: true,
        };
      } else {
        message.error(response.message || '获取立即买入记录失败');
        return {
          data: [],
          total: 0,
          success: false,
        };
      }
    } catch (error) {
      console.error('获取立即买入记录失败:', error);
      message.error('获取立即买入记录失败');
      return {
        data: [],
        total: 0,
        success: false,
      };
    }
  };

  // 撤销订单
  const handleCancelOrder = async (recordId: number) => {
    try {
      const response = await immediateBuyRecordService.cancelOrder(recordId);
      if (response.success) {
        message.success('撤销订单成功');
        actionRef.current?.reload();
      } else {
        message.error(response.message || '撤销订单失败');
      }
    } catch (error) {
      console.error('撤销订单失败:', error);
      message.error('撤销订单失败');
    }
  };

  // 批量撤销订单
  const handleBatchCancelOrders = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要撤销的订单');
      return;
    }

    const recordIds = selectedRowKeys.map(key => Number(key));
    
    try {
      const response = await immediateBuyRecordService.batchCancelOrder(recordIds);
      if (response.success && response.data) {
        const { totalCount, successCount, failureCount, successDetails, failureDetails } = response.data;
        
        // 构建详细反馈信息
        const detailInfo: string[] = [];
        detailInfo.push(`批量撤销订单完成: 总数 ${totalCount}, 成功 ${successCount}, 失败 ${failureCount}`);
        detailInfo.push('');
        
        if (successDetails && successDetails.length > 0) {
          detailInfo.push('✅ 成功撤销:');
          successDetails.forEach((detail: string) => {
            detailInfo.push(`  ${detail}`);
          });
          detailInfo.push('');
        }
        
        if (failureDetails && failureDetails.length > 0) {
          detailInfo.push('❌ 撤销失败:');
          failureDetails.forEach((detail: string) => {
            detailInfo.push(`  ${detail}`);
          });
        }
        
        // 显示详细结果
        Modal.info({
          title: `批量撤销订单结果 (${totalCount}个订单)`,
          content: (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{detailInfo.join('\n')}</pre>
            </div>
          ),
          width: 600,
        });
        
        // 清空选择并刷新列表
        setSelectedRowKeys([]);
        actionRef.current?.reload();
      } else {
        message.error(response.message || '批量撤销订单失败');
      }
    } catch (error) {
      console.error('批量撤销订单失败:', error);
      message.error('批量撤销订单失败');
    }
  };

  // 渲染买入状态标签
  const renderBuyStatus = (status: string) => {
    if (status === 'SUCCESS') {
      return <Tag color="green">成功</Tag>;
    } else if (status === 'FAILED') {
      return <Tag color="red">失败</Tag>;
    }
    return <Tag>{status}</Tag>;
  };

  // 渲染订单状态标签
  const renderOrderStatus = (record: ImmediateBuyRecord) => {
    if (!record.orderStatus) {
      return <Tag color="gray">无订单</Tag>;
    }

    let color = 'blue';
    if (record.orderStatus === 11) { // 已成交
      color = 'green';
    } else if (record.orderStatus === 5) { // 等待成交
      color = 'orange';
    } else if (record.orderStatus === 21 || record.orderStatus === 22) { // 已撤销
      color = 'red';
    }

    return <Tag color={color}>{record.orderStatusName || '未知状态'}</Tag>;
  };

  // 渲染操作按钮
  const renderActions = (record: ImmediateBuyRecord) => {
    const actions = [];

    // 撤销订单按钮
    if (record.canCancel && record.orderNo) {
      actions.push(
        <Button
          key="cancel"
          type="link"
          size="small"
          icon={<StopOutlined />}
          danger
          onClick={() => handleCancelOrder(record.id)}
        >
          撤销订单
        </Button>
      );
    }

    return <Space size="small">{actions}</Space>;
  };

  const columns: ProColumns<ImmediateBuyRecord>[] = [
    {
      title: '策略名称',
      dataIndex: 'strategyName',
      width: 120,
      ellipsis: true,
      hidden: true,
      search: false, // 移除搜索
    },
    {
      title: '股票代码',
      dataIndex: 'stockCode',
      width: 100,
      search: {
        transform: (value) => ({ stockCode: value }),
      },
    },
    {
      title: '账户',
      dataIndex: 'account',
      width: 100,
      hidden: true,
      search: false, // 移除搜索
    },
    {
      title: '账户名称',
      dataIndex: 'accountName',
      width: 120,
      ellipsis: true,
      valueType: 'select',
      fieldProps: {
        options: accountOptions,
        showSearch: true,
        placeholder: '请选择账户',
        allowClear: true,
      },
      search: {
        transform: (value) => ({ account: value }),
      },
    },
    {
      title: '提交状态',
      dataIndex: 'buyStatus',
      width: 100,
      render: (_, record) => renderBuyStatus(record.buyStatus),
      valueEnum: {
        SUCCESS: '成功',
        FAILED: '失败',
      },
      search: false, // 移除搜索
    },
    {
      title: '订单状态',
      width: 150,
      render: (_, record) => renderOrderStatus(record),
      search: false,
    },
    {
      title: '买入类型',
      dataIndex: 'buyType',
      width: 100,
      hidden: true,
      valueEnum: {
        SINGLE: '单个买入',
        BATCH: '批量买入',
      },
      search: false, // 移除搜索
    },
    {
      title: '资金设置',
      width: 120,
      render: (_, record) => {
        if (record.fundPercent) {
          return `${(record.fundPercent * 100).toFixed(2)}%`;
        } else if (record.fixedAmount) {
          return `$${record.fixedAmount.toFixed(2)}`;
        }
        return '-';
      },
      search: false,
    },
    {
      title: '盈利比例',
      dataIndex: 'profitRatio',
      width: 100,
      render: (_, record) => record.profitRatio ? `${(record.profitRatio * 100).toFixed(2)}%` : '-',
      search: false,
    },
    {
      title: '股票价格',
      dataIndex: 'stockPrice',
      width: 100,
      render: (_, record) => record.stockPrice ? `$${record.stockPrice.toFixed(4)}` : '-',
      search: false,
    },
    {
      title: '买入数量',
      dataIndex: 'buyQuantity',
      width: 100,
      render: (_, record) => record.buyQuantity ? record.buyQuantity.toFixed(0) : '-',
      search: false,
    },
    {
      title: '买入金额',
      dataIndex: 'buyAmount',
      width: 120,
      render: (_, record) => record.buyAmount ? `$${record.buyAmount.toFixed(2)}` : '-',
      search: false,
    },
    {
      title: '成交数量',
      dataIndex: 'fillQty',
      width: 100,
      render: (_, record) => record.fillQty ? record.fillQty.toFixed(0) : '-',
      search: false,
    },
    {
      title: '成交均价',
      dataIndex: 'fillAvgPrice',
      width: 100,
      render: (_, record) => record.fillAvgPrice ? `$${record.fillAvgPrice.toFixed(4)}` : '-',
      search: false,
    },
    {
      title: '成交金额',
      dataIndex: 'fillAmount',
      width: 120,
      render: (_, record) => record.fillAmount ? `$${record.fillAmount.toFixed(2)}` : '-',
      search: false,
    },
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 120,
      ellipsis: true,
      copyable: true,
      search: false,
    },
    {
      title: '卖出单号',
      dataIndex: 'sellOrderNo',
      width: 120,
      ellipsis: true,
      copyable: true,
      render: (value) => value || '-',
      search: false,
    },
    {
      title: '卖出状态',
      dataIndex: 'sellOrderStatusName',
      width: 120,
      render: (_, record) => {
        if (!record.sellOrderStatus) {
          return <Tag color="gray">无卖出</Tag>;
        }

        let color = 'blue';
        if (record.sellOrderStatus === 11) { // 已成交
          color = 'green';
        } else if (record.sellOrderStatus === 5) { // 等待成交
          color = 'orange';
        } else if (record.sellOrderStatus === 21 || record.sellOrderStatus === 22) { // 已撤销
          color = 'red';
        }

        return <Tag color={color}>{record.sellOrderStatusName || '未知状态'}</Tag>;
      },
      search: false,
    },
    {
      title: '盈利金额',
      dataIndex: 'profitAmount',
      width: 120,
      render: (_, record) => {
        if (record.profitAmount === null || record.profitAmount === undefined) {
          return '-';
        }
        const color = record.profitAmount >= 0 ? 'green' : 'red';
        const symbol = record.profitAmount >= 0 ? '+' : '';
        return (
          <span style={{ color }}>
            {symbol}${record.profitAmount.toFixed(2)}
          </span>
        );
      },
      search: false,
    },
    
    {
      title: '买入原因',
      dataIndex: 'buyReason',
      width: 150,
      ellipsis: true,
      search: false,
      hidden: true,
    },
    {
      title: '失败原因',
      dataIndex: 'failureReason',
      width: 200,
      ellipsis: true,
      render: (value) => value ? (
        <Tooltip title={value}>
          <span style={{ color: 'red' }}>{value}</span>
        </Tooltip>
      ) : '-',
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 160,
      valueType: 'dateTime',
      search: false,
      sorter: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_, record) => renderActions(record),
    },
  ];

  return (
    <PageContainer
      header={{
        title: '立即买入记录',
        subTitle: '查看和管理立即买入记录，包括订单状态和撤销功能',
      }}
    >
      <Card>
        <ProTable<ImmediateBuyRecord>
          headerTitle="立即买入记录列表"
          actionRef={actionRef}
          rowKey="id"
          search={{
            labelWidth: 120,
            defaultCollapsed: false,
          }}
          toolBarRender={() => [
            <Button
              key="batch-cancel"
              danger
              disabled={selectedRowKeys.length === 0}
              onClick={handleBatchCancelOrders}
            >
              批量撤销订单 ({selectedRowKeys.length})
            </Button>,
            <Button
              key="refresh"
              icon={<ReloadOutlined />}
              onClick={() => actionRef.current?.reload()}
            >
              刷新
            </Button>,
          ]}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            getCheckboxProps: (record) => ({
              // 只有可撤销的订单才能选择
              disabled: !record.canCancel,
            }),
          }}
          request={fetchImmediateBuyRecords}
          columns={columns}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/总共 ${total} 条`,
          }}
          scroll={{ x: 1600 }}
          size="small"
        />
      </Card>
    </PageContainer>
  );
});

export default ImmediateBuyRecordList; 