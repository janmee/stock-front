import {createAccountInfo, deleteAccountInfo, listAccountInfo, updateAccountInfo, updateAccountStatus, generateAccountConfig, startOpenD} from '@/services/ant-design-pro/api';
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
import { md5 } from '@/utils/crypto';

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRowsState, setSelectedRows] = useState<API.AccountInfo[]>([]);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<API.AccountInfo | undefined>(undefined);
  const [form] = Form.useForm();

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
          const response = await deleteAccountInfo(id);
          
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
    setCurrentAccount(record);  // 先设置当前账户
    form.setFieldsValue({
      ...record,
      overPercent: record.overPercent * 100, // 将小数转换为百分比显示
      tradePassword: '', // 清空交易密码字段
      loginPassword: '', // 清空登录密码字段
    });  // 设置表单值
    setEditModalVisible(true);  // 打开模态框
  };

  // 处理更新账户信息
  const handleUpdateAccount = async (values: any) => {
    if (!currentAccount) return false;
    
    try {
      // 如果有登录密码或交易密码，进行MD5加密
      const formValues = { ...values };
      
      // 如果密码为空字符串，则从提交数据中删除该字段（不更新密码）
      if (!formValues.loginPassword) {
        delete formValues.loginPassword;
      } else {
        formValues.loginPassword = md5(formValues.loginPassword);
      }
      
      if (!formValues.tradePassword) {
        delete formValues.tradePassword;
      } else {
        formValues.tradePassword = md5(formValues.tradePassword);
      }
      
      const response = await updateAccountInfo({
        id: currentAccount.id,
        ...formValues,
        overPercent: formValues.overPercent / 100, // 将百分比转换为小数
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
      // 登录密码和交易密码MD5加密
      const formValues = { ...values };
      if (formValues.loginPassword) {
        formValues.loginPassword = md5(formValues.loginPassword);
      }
      if (formValues.tradePassword) {
        formValues.tradePassword = md5(formValues.tradePassword);
      }
      
      const response = await createAccountInfo({
        ...formValues,
        overPercent: formValues.overPercent / 100, // 将百分比转换为小数
      });
      
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

  // 处理生成配置
  const handleGenerateConfig = async (account: string) => {
    try {
      const response = await generateAccountConfig({
        account
      });
      
      if (response.success) {
        message.success('配置文件生成成功');
      } else {
        message.error(response.message || '生成配置失败');
      }
    } catch (error) {
      message.error('生成配置请求失败');
      console.error('生成配置错误:', error);
    }
  };

  // 处理启动OpenD
  const handleStartOpenD = async (account: string) => {
    try {
      const response = await startOpenD({
        account
      });
      
      if (response.success) {
        message.success('OpenD已启动成功');
      } else {
        message.error(response.message || '启动OpenD失败');
      }
    } catch (error) {
      message.error('启动OpenD请求失败');
      console.error('启动OpenD错误:', error);
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
      title: '是否连接OpenD',
      dataIndex: 'connected',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => {
        // 这里假设record中有connected字段表示连接状态
        const isConnected = record.connected === true;
        return (
          <span style={{ color: isConnected ? '#52c41a' : '#ff4d4f' }}>
            {isConnected ? '已连接' : '未连接'}
          </span>
        );
      }
    },
    {
      title: '资金账户ID',
      dataIndex: 'accId',
      valueType: 'text',
      hideInSearch: true,
    },

    {
      title: '可用资金',
      dataIndex: 'availableAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '总资产',
      dataIndex: 'totalAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '证券市值',
      dataIndex: 'marketVal',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '初始资金',
      dataIndex: 'initAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '最大使用资金占比',
      dataIndex: 'overPercent',
      valueType: 'percent',
      hideInSearch: true,
      sorter: true,
      render: (_, record) => `${(record.overPercent * 100).toFixed(2)}%`,
    },
    {
      title: '购买力',
      dataIndex: 'power',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      valueType: 'text',
      hideInSearch: true,
      valueEnum: {
        '-1': { text: '未知', status: 'Default' },
        '0': { text: '安全', status: 'Success' },
        '1': { text: '预警', status: 'Warning' },
        '2': { text: '危险', status: 'Error' },
        '3': { text: '绝对安全', status: 'Success' },
        '4': { text: '危险', status: 'Error' },
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
      title: '状态',
      dataIndex: 'enable',
      valueType: 'switch',
      hideInSearch: true,
      render: (_, record) => (
        <Switch
          checked={record.enable}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
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
        // <Button
        //   key="generateConfig"
        //   type="link"
        //   onClick={() => handleGenerateConfig(record.account)}
        // >
        //   生成配置
        // </Button>,
        <Button
          key="startOpenD"
          type="link"
          onClick={() => handleStartOpenD(record.account)}
        >
          启动OpenD
        </Button>,
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
      <ProTable<API.AccountInfo>
        headerTitle={intl.formatMessage({
          id: 'pages.accountInfo.title',
          defaultMessage: '账户列表',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        params={{
          master: false,
          follow: false
        }}
        request={listAccountInfo}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
        toolBarRender={() => [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            新建
          </Button>,
        ]}
      />

      {/* 编辑账户表单 */}
      <ModalForm
        title="编辑账户信息"
        width={500}
        open={editModalVisible}
        onOpenChange={(visible) => {
          setEditModalVisible(visible);
          if (!visible) {
            setCurrentAccount(undefined);
            // 重置表单
            form.resetFields();
          }
        }}
        onFinish={handleUpdateAccount}
        initialValues={currentAccount}
        form={form}
        submitter={{
          searchConfig: {
            submitText: '确认',
            resetText: '取消',
          },
          render: (props, defaultDoms) => {
            return [
              ...defaultDoms,
            ];
          },
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
            placeholder="请输入交易密码（将进行MD5加密）"
            rules={[{ required: false, message: '请输入交易密码' }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
            tooltip="不填写则不会更新交易密码"
          />
          <ProFormText.Password
            name="loginPassword"
            label="登录密码"
            placeholder="请输入登录密码（将进行MD5加密）"
            rules={[{ required: false, message: '请输入登录密码' }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
            tooltip="不填写则不会更新登录密码"
          />
          <ProFormDigit
            name="overPercent"
            label="最大使用资金占比(%)"
            placeholder="请输入最大使用资金占比"
            min={0}
            max={200}
            fieldProps={{
              precision: 2,
              step: 1,
              formatter: (value) => `${value}%`,
              parser: (value) => value ? parseFloat(value.replace('%', '')) : 0,
            }}
            rules={[{ required: true, message: '请输入最大使用资金占比' }]}
          />
          <ProFormDigit
            name="initAmount"
            label="初始资金"
            placeholder="请输入初始资金"
            min={0}
            fieldProps={{
              precision: 2,
              step: 0.01,
            }}
            rules={[{ required: true, message: '请输入初始资金' }]}
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
          <ProFormText
            name="accId"
            label="资金账户ID(默认自动获取)"
            placeholder="请输入资金账户ID"
            tooltip="资金账户ID为可选字段"
            rules={[{ required: false }]}
          />
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
          master: true,
          overPercent: 100,  // 默认最大使用资金占比为100%
          initAmount: 0  // 默认初始资金为0
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
            placeholder="请输入交易密码（将进行MD5加密）"
            rules={[{ required: true, message: '请输入交易密码' }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
          />
          <ProFormText.Password
            name="loginPassword"
            label="登录密码"
            placeholder="请输入登录密码（将进行MD5加密）"
            rules={[{ required: true, message: '请输入登录密码' }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
          />
          <ProFormDigit
            name="overPercent"
            label="最大使用资金占比(%)"
            placeholder="请输入最大使用资金占比"
            min={0}
            max={200}
            fieldProps={{
              precision: 2,
              step: 1,
              formatter: (value) => `${value}%`,
              parser: (value) => value ? parseFloat(value.replace('%', '')) : 0,
            }}
            rules={[{ required: true, message: '请输入最大使用资金占比' }]}
          />
          <ProFormDigit
            name="initAmount"
            label="初始资金（美金）"
            placeholder="请输入初始资金"
            min={0}
            fieldProps={{
              precision: 2,
              step: 0.01,
            }}
            rules={[{ required: true, message: '请输入初始资金' }]}
          />
          <ProFormSwitch
            name="master"
            label="主账户"
            checkedChildren="是"
            unCheckedChildren="否"
            initialValue={true}
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
          <ProFormText
            name="accId"
            label="资金账户ID(默认自动获取)"
            placeholder="请输入资金账户ID"
            tooltip="资金账户ID为可选字段"
            rules={[{ required: false }]}
          />
        </ProForm.Group>
      </ModalForm>
    </PageContainer>
  );
};

export default TableList;