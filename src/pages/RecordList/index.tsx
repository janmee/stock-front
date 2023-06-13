import {addRule, listFoundTrading, removeRule, updateRule} from '@/services/ant-design-pro/api';
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
import {Button, Drawer, Input, message} from 'antd';
import React, {useRef, useState} from 'react';
import type {FormValueType} from './components/UpdateForm';
import UpdateForm from './components/UpdateForm';
import {history} from "umi";

/**
 * @en-US Add node
 * @zh-CN 添加节点
 * @param fields
 */
const handleAdd = async (fields: API.RuleListItem) => {
  const hide = message.loading('正在添加');
  try {
    await addRule({...fields});
    hide();
    message.success('Added successfully');
    return true;
  } catch (error) {
    hide();
    message.error('Adding failed, please try again!');
    return false;
  }
};

/**
 * @en-US Update node
 * @zh-CN 更新节点
 *
 * @param fields
 */
const handleUpdate = async (fields: FormValueType) => {
  const hide = message.loading('Configuring');
  try {
    await updateRule({
      name: fields.name,
      desc: fields.desc,
      key: fields.key,
    });
    hide();

    message.success('Configuration is successful');
    return true;
  } catch (error) {
    hide();
    message.error('Configuration failed, please try again!');
    return false;
  }
};

/**
 *  Delete node
 * @zh-CN 删除节点
 *
 * @param selectedRows
 */
const handleRemove = async (selectedRows: API.RuleListItem[]) => {
  const hide = message.loading('正在删除');
  if (!selectedRows) return true;
  try {
    await removeRule({
      key: selectedRows.map((row) => row.key),
    });
    hide();
    message.success('Deleted successfully and will refresh soon');
    return true;
  } catch (error) {
    hide();
    message.error('Delete failed, please try again');
    return false;
  }
};

const TableList: React.FC = () => {
  /**
   * @en-US Pop-up window of new window
   * @zh-CN 新建窗口的弹窗
   *  */
  const [createModalOpen, handleModalOpen] = useState<boolean>(false);
  /**
   * @en-US The pop-up window of the distribution update window
   * @zh-CN 分布更新窗口的弹窗
   * */
  const [updateModalOpen, handleUpdateModalOpen] = useState<boolean>(false);

  const [showDetail, setShowDetail] = useState<boolean>(false);


  const actionRef = useRef<ActionType>();
  const [currentRow, setCurrentRow] = useState<API.RuleListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.RuleListItem[]>([]);

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */

  const intl = useIntl();

  // intl.pa
  // 初始化路径参数中的code
  const code: string = history.location.search.split("code=")[1]
  console.log(code)

  const columns: ProColumns<API.RuleListItem>[] = [
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.updateForm.ruleName.nameLabel"
          defaultMessage="Rule name"
        />
      ),
      dataIndex: 'code',
      valueType: 'text',
      initialValue: code,
      tip: 'The stock code is the unique key',
      render: (dom, entity) => {
        return (
          <a
            onClick={() => {
              setCurrentRow(entity);
              setShowDetail(true);
            }}
          >
            {dom}
          </a>
        );
      },
    },

    {
      title: <FormattedMessage id="pages.searchTable.foundName" defaultMessage="Description"/>,
      dataIndex: 'name',
      valueType: 'textarea',
    },
    {
      title: <FormattedMessage id="pages.searchTable.buyDate" defaultMessage="Description"/>,
      dataIndex: 'buyDate',
      valueType: 'date',
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.buyPrice" defaultMessage="Description"/>,
      dataIndex: 'buyPrice',
      valueType: 'textarea',
      hideInTable: true,
      hideInSearch: true,
      sorter: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
          id: 'pages.searchTable.yuan',
          defaultMessage: ' 元 ',
        })}` : '-',
    },
    {
      title: <FormattedMessage id="pages.searchTable.buyNumber" defaultMessage="Description"/>,
      dataIndex: 'buyNumber',
      valueType: 'textarea',
      hideInTable: true,
      hideInSearch: true,
      sorter: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
          id: 'pages.searchTable.piece',
          defaultMessage: ' 股 ',
        })}` : '-',
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.buyAmount"
          defaultMessage="Number of service calls"
        />
      ),
      dataIndex: 'buyAmount',
      sorter: true,
      hideInForm: true,
      hideInSearch: true,
      renderText: (val: string) =>
        `${val}${intl.formatMessage({
          id: 'pages.searchTable.yuan',
          defaultMessage: ' 元 ',
        })}`,
    },
    {
      title: <FormattedMessage id="pages.searchTable.saleDate" defaultMessage="Description"/>,
      dataIndex: 'saleDate',
      valueType: 'date',
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.salePrice" defaultMessage="Description"/>,
      dataIndex: 'salePrice',
      valueType: 'textarea',
      hideInTable: true,
      hideInSearch: true,
      sorter: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
          id: 'pages.searchTable.yuan',
          defaultMessage: ' 元 ',
        })}` : '-',
    },
    {
      title: <FormattedMessage id="pages.searchTable.saleNumber" defaultMessage="Description"/>,
      dataIndex: 'saleNumber',
      valueType: 'textarea',
      hideInTable: true,
      hideInSearch: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
          id: 'pages.searchTable.piece',
          defaultMessage: ' 元 ',
        })}` : '-',
    },
    {
      title: <FormattedMessage id="pages.searchTable.saleAmount" defaultMessage="saleAmount"/>,
      dataIndex: 'saleAmount',
      sorter: true,
      hideInForm: true,
      hideInSearch: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
            id: 'pages.searchTable.yuan',
            defaultMessage: ' 元 ',
          })}`
          : '-',
    },
    {
      title: <FormattedMessage id="pages.searchTable.income" defaultMessage="income"/>,
      dataIndex: 'income',
      sortDirections: [],
      hideInForm: true,
      hideInSearch: true,
      sorter: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
          id: 'pages.searchTable.yuan',
          defaultMessage: ' 元 ',
        })}` : '-',
    },
    {
      title: '收益率',
      dataIndex: 'incomeRate',
      hideInSearch: true,
      hideInTable: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
          id: 'pages.searchTable.percent',
          defaultMessage: ' % ',
        })}` : '-',
    },
    {
      title: <FormattedMessage id="pages.searchTable.holdDays" defaultMessage="Description"/>,
      dataIndex: 'holdDays',
      valueType: 'textarea',
      sorter: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
          id: 'pages.searchTable.day',
          defaultMessage: ' 天 ',
        })}` : '-',
    },
    {
      title: (
        <FormattedMessage id="pages.searchTable.dailyIncomeRate" defaultMessage="dailyIncomeRate"/>
      ),
      dataIndex: 'dailyIncomeRate',
      sorter: true,
      hideInSearch: true,
      hideInForm: true,
      renderText: (val: string) =>
        val !== null ? `${val}${intl.formatMessage({
          id: 'pages.searchTable.percent',
          defaultMessage: ' % ',
        })}` : '-',
    },
    {
      title: '选股策略',
      dataIndex: 'strategyName',
      sorter: true,
      hideInForm: true,
    },
    {
      title: <FormattedMessage id="pages.searchTable.titleStatus" defaultMessage="Status"/>,
      dataIndex: 'sold',
      hideInForm: true,
      order: 1,
      sorter: true,
      valueEnum: {
        // 2: {
        //   text: (
        //     <FormattedMessage
        //       id="pages.searchTable.nameStatus.default"
        //       defaultMessage="Shut down"
        //     />
        //   ),
        //   status: 'Default',
        // },
        1: {
          text: <FormattedMessage id="pages.searchTable.titleStatus.sold" defaultMessage="sold"/>,
          status: 'Processing',
        },
        0: {
          text: (
            <FormattedMessage id="pages.searchTable.titleStatus.notSold" defaultMessage="notSold"/>
          ),
          status: 'Error',
        },
      },
    },
    {
      title: <FormattedMessage id="pages.searchTable.createTime" defaultMessage="Description"/>,
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInTable: true,
      hideInSearch: true,
      sorter: true,
    },
    {
      title: (
        <FormattedMessage id="pages.searchTable.updateTime" defaultMessage="Last updateTime"/>
      ),
      sorter: true,
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInSearch: true,
      renderFormItem: (item, {defaultRender, ...rest}, form) => {
        const status = form.getFieldValue('status');
        if (`${status}` === '0') {
          return false;
        }
        if (`${status}` === '3') {
          return (
            <Input
              {...rest}
              placeholder={intl.formatMessage({
                id: 'pages.searchTable.exception',
                defaultMessage: 'Please enter the reason for the exception!',
              })}
            />
          );
        }
        return defaultRender(item);
      },
    },
    // {
    //   title: <FormattedMessage id="pages.searchTable.titleOption" defaultMessage="Operating" />,
    //   dataIndex: 'option',
    //   valueType: 'option',
    //   render: (_, record) => [
    //     <a
    //       key="config"
    //       onClick={() => {
    //         handleUpdateModalOpen(true);
    //         setCurrentRow(record);
    //       }}
    //     >
    //       <FormattedMessage id="pages.searchTable.config" defaultMessage="Configuration" />
    //     </a>,
    //     <a key="subscribeAlert" href="https://procomponents.ant.design/">
    //       <FormattedMessage
    //         id="pages.searchTable.subscribeAlert"
    //         defaultMessage="Subscribe to alerts"
    //       />
    //     </a>,
    //   ],
    // },
  ];


  return (
    <PageContainer>
      <ProTable<API.RuleListItem, API.PageParams>
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.title',
          defaultMessage: 'Enquiry form',
        })}
        actionRef={actionRef}
        rowKey="key"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          // 新建按钮
          // <Button
          //   type="primary"
          //   key="primary"
          //   onClick={() => {
          //     handleModalOpen(true);
          //   }}
          // >
          //   <PlusOutlined/> <FormattedMessage id="pages.searchTable.new" defaultMessage="New"/>
          // </Button>,
        ]}
        request={listFoundTrading}
        columns={columns}
        // rowSelection={{
        //   onChange: (_, selectedRows) => {
        //     setSelectedRows(selectedRows);
        //   },
        // }}
      />
      {selectedRowsState?.length > 0 && (
        <FooterToolbar
          extra={
            <div>
              <FormattedMessage id="pages.searchTable.chosen" defaultMessage="Chosen"/>{' '}
              <a style={{fontWeight: 600}}>{selectedRowsState.length}</a>{' '}
              <FormattedMessage id="pages.searchTable.item" defaultMessage="项"/>
              &nbsp;&nbsp;
              <span>
                <FormattedMessage
                  id="pages.searchTable.totalServiceCalls"
                  defaultMessage="Total number of service calls"
                />{' '}
                {selectedRowsState.reduce((pre, item) => pre + item.callNo!, 0)}{' '}
                <FormattedMessage id="pages.searchTable.tenThousand" defaultMessage="万"/>
              </span>
            </div>
          }
        >
          <Button
            onClick={async () => {
              await handleRemove(selectedRowsState);
              setSelectedRows([]);
              actionRef.current?.reloadAndRest?.();
            }}
          >
            <FormattedMessage
              id="pages.searchTable.batchDeletion"
              defaultMessage="Batch deletion"
            />
          </Button>
          <Button type="primary">
            <FormattedMessage
              id="pages.searchTable.batchApproval"
              defaultMessage="Batch approval"
            />
          </Button>
        </FooterToolbar>
      )}
      <ModalForm
        title={intl.formatMessage({
          id: 'pages.searchTable.createForm.newRule',
          defaultMessage: 'New rule',
        })}
        width="400px"
        open={createModalOpen}
        onOpenChange={handleModalOpen}
        onFinish={async (value) => {
          const success = await handleAdd(value as API.RuleListItem);
          if (success) {
            handleModalOpen(false);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
      >
        <ProFormText
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.searchTable.ruleName"
                  defaultMessage="Rule name is required"
                />
              ),
            },
          ]}
          width="md"
          name="name"
        />
        <ProFormTextArea width="md" name="desc"/>
      </ModalForm>
      <UpdateForm
        onSubmit={async (value) => {
          const success = await handleUpdate(value);
          if (success) {
            handleUpdateModalOpen(false);
            setCurrentRow(undefined);
            if (actionRef.current) {
              actionRef.current.reload();
            }
          }
        }}
        onCancel={() => {
          handleUpdateModalOpen(false);
          if (!showDetail) {
            setCurrentRow(undefined);
          }
        }}
        updateModalOpen={updateModalOpen}
        values={currentRow || {}}
      />

      <Drawer
        width={600}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.name && (
          <ProDescriptions<API.RuleListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.RuleListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
