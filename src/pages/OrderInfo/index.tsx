import {listOrderInfo, cancelOrder, listAccountInfo} from '@/services/ant-design-pro/api';
import type {ActionType, ProColumns, ProDescriptionsItemProps} from '@ant-design/pro-components';
import {
  FooterToolbar,
  ModalForm,
  PageContainer,
  ProDescriptions,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import {FormattedMessage, useIntl} from '@umijs/max';
import {Button, Drawer, Modal, message, Select} from 'antd';
import React, {useRef, useState, useEffect} from 'react';
import {Area} from "@ant-design/charts";
import { getLocale } from '@umijs/max';

const TableList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalOpen2, setModalOpen2] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.RuleListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.RuleListItem[]>([]);
  const [accountOptions, setAccountOptions] = useState<{ label: string; value: string }[]>([]);

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();
  const currentLocale = getLocale();

  // 获取账号选项数据
  useEffect(() => {
    const fetchAccountOptions = async () => {
      try {
        const response = await listAccountInfo({
          current: 1,
          pageSize: 1000,
        }, {});
        
        if (response && response.data) {
          const options = response.data.map((account: API.AccountInfo) => ({
            label: `${account.name} (${account.account})${account.enable ? '' : ' [已禁用]'}`,
            value: account.account,
          }));
          setAccountOptions(options);
        }
      } catch (error) {
        console.error('获取账号选项失败:', error);
      }
    };
    
    fetchAccountOptions();
  }, []);

  // 获取当前语言环境的金额格式
  const getMoneyLocale = () => {
    return currentLocale === 'zh-CN' ? 'zh-CN' : 'en-US';
  };

  // 处理撤单操作
  const handleCancelOrder = async (orderNo: string) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.trade.confirmCancel.title', defaultMessage: 'Confirm Cancellation' }),
      content: intl.formatMessage(
        { id: 'pages.trade.confirmCancel.content', defaultMessage: 'Are you sure you want to cancel order {orderNo}?' },
        { orderNo }
      ),
      onOk: async () => {
        try {
          const response = await cancelOrder({
            orderNo
          });
          
          if (response.data === true) {
            message.success(intl.formatMessage({ id: 'pages.trade.cancelSuccess', defaultMessage: 'Order canceled successfully' }));
            // 刷新表格数据
            actionRef.current?.reload();
          } else {
            const errorMsg = response?.errorMessage || response?.message || 
              intl.formatMessage({ id: 'pages.trade.cancelFailed', defaultMessage: 'Failed to cancel order' });
            message.error(errorMsg);
          }
        } catch (error) {
          message.error(intl.formatMessage({ id: 'pages.trade.cancelRequestFailed', defaultMessage: 'Cancel request failed' }));
          console.error('撤单错误:', error);
        }
      }
    });
  };

  const columns: ProColumns[] = [
    {
      title: <FormattedMessage id="pages.searchTable.accountName" defaultMessage="Account Name" />,
      dataIndex: 'accountName',
      valueType: 'textarea',
      sorter: true,
      hideInSearch: false,
      renderFormItem: (item, { type, defaultRender, ...rest }, form) => {
        if (type === 'form') {
          return null;
        }
        return (
          <Select
            showSearch
            placeholder={intl.formatMessage({ id: 'pages.trade.selectAccount', defaultMessage: '请选择账号' })}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={accountOptions}
            allowClear
          />
        );
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.code" defaultMessage="Stock Code" />,
      dataIndex: 'code',
      valueType: 'textarea',
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.systemType" defaultMessage="Order Source" />,
      dataIndex: 'systemType',
      valueType: 'select',
      sorter: true,
      hideInSearch: false,
      valueEnum: {
        '0': { text: <FormattedMessage id="pages.order.source.dingtou" defaultMessage="Investment Plan" /> },
        '1': { text: <FormattedMessage id="pages.order.source.following" defaultMessage="Follow Order" /> },
        '2': { text: <FormattedMessage id="pages.order.source.futu" defaultMessage="Futu Sync" /> },
        '3': { text: <FormattedMessage id="pages.order.source.marketDrop" defaultMessage="Market Drop Trigger" /> },
        '4': { text: <FormattedMessage id="pages.order.source.manual" defaultMessage="Manual Order" /> },
        '5': { text: <FormattedMessage id="pages.order.source.manualProfit" defaultMessage="Manual Profit Order" /> },
        '6': { text: <FormattedMessage id="pages.order.source.dingtouProfit" defaultMessage="Investment Profit Order" /> },
        '7': { text: <FormattedMessage id="pages.order.source.maStrategy" defaultMessage="MA Strategy" /> },
        '8': { text: <FormattedMessage id="pages.order.source.strategyProfit" defaultMessage="Strategy Profit Order" /> },
        '9': { text: <FormattedMessage id="pages.order.source.highOscillationStrategy" defaultMessage="High Oscillation Strategy Order" /> },
      }
    },
    {
      title: <FormattedMessage id="pages.searchTable.trdSide" defaultMessage="Buy Direction" />,
      dataIndex: 'trdSide',
      valueType: 'textarea',
      hideInSearch: false,
      valueEnum: {
        '1': { text: '买入' },
        '2': { text: '卖出' },
      }
    },
    {
      title: <FormattedMessage id="pages.searchTable.orderType" defaultMessage="Order Type" />,
      dataIndex: 'orderType',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.orderNo" defaultMessage="Order Number" />,
      dataIndex: 'orderNo',
      valueType: 'textarea',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.number" defaultMessage="Order Quantity" />,
      dataIndex: 'number',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.price" defaultMessage="Stock Price" />,
      dataIndex: 'price',
      render: (_, record) => {
        return record.orderType === '市价单' ? 
          <FormattedMessage id="pages.order.marketPrice" defaultMessage="Market Price" /> : 
          record.price;
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.amount" defaultMessage="Order Amount" />,
      dataIndex: 'amount',
      render: (_, record) => {
        return record.orderType === '市价单' ? 
          <FormattedMessage id="pages.order.marketPrice" defaultMessage="Market Price" /> : 
          record.amount;
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.fillQty" defaultMessage="Fill Quantity" />,
      dataIndex: 'fillQty',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.fillAvgPrice" defaultMessage="Average Fill Price" />,
      dataIndex: 'fillAvgPrice',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.createTime" defaultMessage="Creation Time" />,
      dataIndex: 'createTime',
      valueType: 'textarea',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.status" defaultMessage="Status" />,
      dataIndex: 'status',
      hideInSearch: true,
      sorter: true,
      valueEnum: {
        1: {
          text: <FormattedMessage id="pages.order.status.filled" defaultMessage="Filled" />,
          status: 'Success',
        },
        0: {
          text: <FormattedMessage id="pages.order.status.unfilled" defaultMessage="Unfilled" />,
          status: 'Error',
        },
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.extra" defaultMessage="Extra Info" />,
      dataIndex: 'extra',
      valueType: 'textarea',
      hideInSearch: true,
      width: 80,
      render: (_, record) => {
        if (!record.extra) return '-';
        return <div style={{ wordBreak: 'break-all', whiteSpace: 'normal' }}>{record.extra}</div>;
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.titleOption" defaultMessage="Option" />,
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => {
        // 检查状态值是否不在1到10之间
        const statusValue = Number(record.statusValue);
        const canCancel = statusValue >= 1 && statusValue <= 10;
        
        return canCancel ? [
          <Button 
            key="cancel" 
            type="primary" 
            danger
            onClick={() => handleCancelOrder(record.orderNo)}
          >
            <FormattedMessage id="pages.order.cancel" defaultMessage="Cancel" />
          </Button>
        ] : null;
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.orderInfoList',
          defaultMessage: '订单列表',
        })}
        actionRef={actionRef}
        rowKey={(record) => record.id || record.orderNo}
        search={{
          labelWidth: 120,
          defaultCollapsed: false,
        }}
        request={async (params, sort, filter) => {
          // 处理账号名称参数，将其转换为account参数
          const requestParams = { ...params };
          if (params.accountName) {
            requestParams.account = params.accountName;
            delete requestParams.accountName;
          }
          
          return await listOrderInfo(requestParams, sort, filter);
        }}
        columns={columns}
        polling={undefined}
        revalidateOnFocus={true}
        debounceTime={0}
        options={{
          reload: true,
        }}
        key={JSON.stringify(selectedRowsState) + new Date().getTime()}
      />
    </PageContainer>
  );
};

export default TableList;
