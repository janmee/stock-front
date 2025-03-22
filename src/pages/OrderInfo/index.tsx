import {listOrderInfo, cancelOrder} from '@/services/ant-design-pro/api';
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
import {Button, Drawer, Modal, message} from 'antd';
import React, {useRef, useState} from 'react';
import {Area} from "@ant-design/charts";

const TableList: React.FC = () => {

  const [createModalOpen, handleModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalOpen2, setModalOpen2] = useState<boolean>(false);

  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.RuleListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.RuleListItem[]>([]);

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  // 处理撤单操作
  const handleCancelOrder = async (orderNo: string) => {
    Modal.confirm({
      title: '确认撤单',
      content: `确定要撤销订单 ${orderNo} 吗？`,
      onOk: async () => {
        try {
          const response = await cancelOrder({
            orderNo
          });
          
          if (response.data === true) {
            message.success('撤单成功');
            // 刷新表格数据
            actionRef.current?.reload();
          } else {
            const errorMsg = response?.errorMessage || response?.message || '撤单失败';
            message.error(errorMsg);
          }
        } catch (error) {
          message.error('撤单请求失败');
          console.error('撤单错误:', error);
        }
      }
    });
  };

  const columns: ProColumns[] = [
    {
      title: '账号',
      dataIndex: 'account',
      valueType: 'textarea',
      sorter: true,
    },
    {
      title: '股票代码',
      dataIndex: 'code',
      valueType: 'textarea',
      sorter: true,
    },
    {
      title: '订单来源',
      dataIndex: 'systemType',
      valueType: 'textarea',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '买入方向',
      dataIndex: 'trdSide',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: '订单类型',
      dataIndex: 'orderType',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: '订单编号',
      dataIndex: 'orderNo',
      valueType: 'textarea',
      sorter: true,
      hideInSearch: true,
    },
    {
      title: '订单数量',
      dataIndex: 'number',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: '股票单价',
      dataIndex: 'price',
      width: 100,
      render: (_, record) => {
        return record.orderType === '市价单' ? '市价' : record.price;
      },
      hideInSearch: true,
    },
    {
      title: '订单金额',
      dataIndex: 'amount',
      width: 120,
      render: (_, record) => {
        return record.orderType === '市价单' ? '市价' : record.amount;
      },
      hideInSearch: true,
    },
    {
      title: '成交数量',
      dataIndex: 'fillQty',
      valueType: 'textarea',
      hideInSearch: true,
    },
    {
      title: '成交均价',
      dataIndex: 'fillAvgPrice',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'textarea',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      hideInSearch: true,
      sorter: true,
      valueEnum: {
        1: {
          text: '已成交',
          status: 'Success',
        },
        0: {
          text: '未成交',
          status: 'Error',
        },
      },
    },
    {
      title: '操作',
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
            撤单
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
        }}
        request={listOrderInfo}
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
