import {createAccountInfo, listAccountInfo, updateAccountInfo, updateAccountStatus} from '@/services/ant-design-pro/api';
import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormText,
  ProFormDigit,
  ProFormSwitch,
  ProTable,
} from '@ant-design/pro-components';
import {useIntl} from '@umijs/max';
import {Button, Form, Modal, Switch, message} from 'antd';
import React, {useRef, useState} from 'react';

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRowsState, setSelectedRows] = useState<API.AccountInfo[]>([]);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<API.AccountInfo | undefined>(undefined);

  /**
   * 国际化配置
   */
  const intl = useIntl();

  // 处理启用/禁用账户
  const handleToggleStatus = async (id: number, enable: boolean) => {
    try {
      // 调用更新账户状态API
      const response = await updateAccountStatus({
        id,
        enable
      });
      
      if (response.success) {
        message.success(enable ? '账户已启用' : '账户已禁用');
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
      } else {
        message.error(response.message || '操作失败');
      }
    } catch (error) {
      message.error('操作请求失败');
      console.error('操作错误:', error);
    }
  };

  // 处理删除账户
  const handleDeleteAccount = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此账户吗？此操作不可恢复。',
      onOk: async () => {
        try {
          // 调用删除账户API
          const response = await updateAccountStatus({
            id,
            deleted: true
          });
          
          if (response.success) {
            message.success('账户已删除');
            // 刷新表格数据
            if (actionRef.current) {
              actionRef.current.reload();
            }
          } else {
            message.error(response.message || '删除失败');
          }
        } catch (error) {
          message.error('删除请求失败');
          console.error('删除错误:', error);
        }
      }
    });
  };

  // 处理编辑账户
  const handleEditAccount = (record: API.AccountInfo) => {
    setCurrentAccount(record);
    setEditModalVisible(true);
  };

  // 处理更新账户信息
  const handleUpdateAccount = async (values: any) => {
    if (!currentAccount) return false;
    
    try {
      const response = await updateAccountInfo({
        id: currentAccount.id,
        ...values
      });
      
      if (response.success) {
        message.success('账户信息已更新');
        setEditModalVisible(false);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(response.message || '更新失败');
        return false;
      }
    } catch (error) {
      message.error('更新请求失败');
      console.error('更新错误:', error);
      return false;
    }
  };

  // 处理创建账户
  const handleCreateAccount = async (values: any) => {
    try {
      const response = await createAccountInfo(values);
      
      if (response.success) {
        message.success('账户创建成功');
        setCreateModalVisible(false);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(response.message || '创建失败');
        return false;
      }
    } catch (error) {
      message.error('创建请求失败');
      console.error('创建错误:', error);
      return false;
    }
  };

  const columns: ProColumns[] = [
    {
      title: '牛牛号',
      dataIndex: 'account',
      valueType: 'text',
      sorter: true,
    },
    {
      title: '账户别名',
      dataIndex: 'name',
      valueType: 'text',
      sorter: true,
    },
    {
      title: '主机地址',
      dataIndex: 'host',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: '端口',
      dataIndex: 'port',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: '交易密码',
      dataIndex: 'tradePassword',
      valueType: 'password',
      hideInSearch: true,
      hideInTable: true,
    },
    {
      title: '可用资金',
      dataIndex: 'availableAmount',
      valueType: 'money',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '总资产',
      dataIndex: 'totalAmount',
      valueType: 'money',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '购买力',
      dataIndex: 'power',
      valueType: 'money',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '主账户',
      dataIndex: 'master',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => (
        <span>{record.master ? '是' : '否'}</span>
      ),
    },
    {
      title: '跟单账户',
      dataIndex: 'follow',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => (
        <span>{record.follow || '-'}</span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'enable',
      valueEnum: {
        true: {
          text: '已启用',
          status: 'Success',
        },
        false: {
          text: '已禁用',
          status: 'Error',
        },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() => handleEditAccount(record)}
        >
          编辑
        </Button>,
        <Switch
          key="toggle"
          checked={record.enabled}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />,
        <Button
          key="delete"
          type="primary"
          danger
          onClick={() => handleDeleteAccount(record.id)}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <ProTable
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.accountInfoList',
          defaultMessage: '账户列表',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="create"
            onClick={() => setCreateModalVisible(true)}
          >
            新建账户
          </Button>,
        ]}
        request={listAccountInfo}
        columns={columns}
        polling={undefined}
        revalidateOnFocus={true}
        debounceTime={0}
        options={{
          reload: true,
        }}
        key={JSON.stringify(selectedRowsState) + new Date().getTime()}
      />

      {/* 编辑账户表单 */}
      <ModalForm
        title="编辑账户信息"
        width={500}
        open={editModalVisible}
        onOpenChange={setEditModalVisible}
        onFinish={handleUpdateAccount}
        initialValues={currentAccount}
      >
        <ProForm.Group>
          <ProFormText
            name="account"
            label="牛牛号"
            placeholder="请输入牛牛号"
            rules={[{ required: true, message: '请输入牛牛号' }]}
          />
          <ProFormText
            name="name"
            label="账户别名"
            placeholder="请输入账户别名"
            rules={[{ required: true, message: '请输入账户别名' }]}
          />
          <ProFormText
            name="host"
            label="主机地址"
            placeholder="请输入主机地址"
            rules={[{ required: true, message: '请输入主机地址' }]}
          />
          <ProFormDigit
            name="port"
            label="端口"
            placeholder="请输入端口"
            min={1}
            max={65535}
            rules={[{ required: true, message: '请输入端口' }]}
          />
          <ProFormText.Password
            name="tradePassword"
            label="交易密码"
            placeholder="请输入交易密码"
            rules={[{ required: true, message: '请输入交易密码' }]}
          />
          <ProFormSwitch
            name="master"
            label="主账户"
            checkedChildren="是"
            unCheckedChildren="否"
          />
          <Form.Item noStyle dependencies={['master']}>
            {({ getFieldValue }) => (
              <ProFormText
                name="follow"
                label="跟单账户"
                placeholder="请输入跟单账户ID"
                disabled={getFieldValue('master')}
              />
            )}
          </Form.Item>
        </ProForm.Group>
      </ModalForm>

      {/* 创建账户表单 */}
      <ModalForm
        title="创建新账户"
        width={500}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreateAccount}
        initialValues={{
          host: '127.0.0.1',
          master: false
        }}
      >
        <ProForm.Group>
          <ProFormText
            name="account"
            label="牛牛号"
            placeholder="请输入牛牛号"
            rules={[{ required: true, message: '请输入牛牛号' }]}
          />
          <ProFormText
            name="name"
            label="账户别名"
            placeholder="请输入账户别名"
            rules={[{ required: true, message: '请输入账户别名' }]}
          />
          <ProFormText
            name="host"
            label="主机地址"
            placeholder="请输入主机地址"
            initialValue="127.0.0.1"
            rules={[{ required: true, message: '请输入主机地址' }]}
          />
          <ProFormDigit
            name="port"
            label="端口"
            placeholder="请输入端口"
            min={1}
            max={65535}
            rules={[{ required: true, message: '请输入端口' }]}
          />
          <ProFormText.Password
            name="tradePassword"
            label="交易密码"
            placeholder="请输入交易密码"
            rules={[{ required: true, message: '请输入交易密码' }]}
          />
          <ProFormSwitch
            name="master"
            label="主账户"
            checkedChildren="是"
            unCheckedChildren="否"
            initialValue={false}
          />
          <Form.Item noStyle dependencies={['master']}>
            {({ getFieldValue }) => (
              <ProFormText
                name="follow"
                label="跟单账户"
                placeholder="请输入跟单账户ID"
                disabled={getFieldValue('master')}
              />
            )}
          </Form.Item>
        </ProForm.Group>
      </ModalForm>
    </PageContainer>
  );
};

export default TableList; 