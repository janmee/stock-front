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
import {useIntl, FormattedMessage} from '@umijs/max';
import {Button, Form, Modal, Switch, message} from 'antd';
import React, {useRef, useState} from 'react';
import { md5 } from '@/utils/crypto';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRowsState, setSelectedRows] = useState<API.AccountInfo[]>([]);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [currentAccount, setCurrentAccount] = useState<API.AccountInfo | undefined>(undefined);
  const [form] = Form.useForm();
  const [showSensitiveInfo, setShowSensitiveInfo] = useState<boolean>(false);

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
        message.success(enable 
          ? intl.formatMessage({ id: 'pages.account.enabled' }) 
          : intl.formatMessage({ id: 'pages.account.disabled' }));
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
      } else {
        message.error(response.message || intl.formatMessage({ id: 'pages.account.operationFailed' }));
      }
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.account.requestFailed' }));
      console.error('操作错误:', error);
    }
  };

  // 处理删除账户
  const handleDeleteAccount = async (id: number) => {
    Modal.confirm({
      title: intl.formatMessage({ id: 'pages.account.confirmDelete' }),
      content: intl.formatMessage({ id: 'pages.account.confirmDeleteContent' }),
      onOk: async () => {
        try {
          // 调用删除账户API
          const response = await deleteAccountInfo(id);
          
          if (response.success) {
            message.success(intl.formatMessage({ id: 'pages.account.deleteSuccess' }));
            // 刷新表格数据
            if (actionRef.current) {
              actionRef.current.reload();
            }
          } else {
            message.error(response.message || intl.formatMessage({ id: 'pages.account.deleteFailed' }));
          }
        } catch (error) {
          message.error(intl.formatMessage({ id: 'pages.account.deleteRequestFailed' }));
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
        message.success(intl.formatMessage({ id: 'pages.account.updateSuccess' }));
        setEditModalVisible(false);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(response.message || intl.formatMessage({ id: 'pages.account.updateFailed' }));
        return false;
      }
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.account.updateRequestFailed' }));
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
        message.success(intl.formatMessage({ id: 'pages.account.createSuccess' }));
        setCreateModalVisible(false);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(response.message || intl.formatMessage({ id: 'pages.account.createFailed' }));
        return false;
      }
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.account.createRequestFailed' }));
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
        message.success(intl.formatMessage({ id: 'pages.account.generateConfigSuccess' }));
      } else {
        message.error(response.message || intl.formatMessage({ id: 'pages.account.generateConfigFailed' }));
      }
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.account.generateConfigRequestFailed' }));
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
        message.success(intl.formatMessage({ id: 'pages.account.startOpenDSuccess' }));
      } else {
        message.error(response.message || intl.formatMessage({ id: 'pages.account.startOpenDFailed' }));
      }
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.account.startOpenDRequestFailed' }));
      console.error('启动OpenD错误:', error);
    }
  };

  const columns: ProColumns[] = [
    {
      title: intl.formatMessage({ id: 'pages.account.accountId' }),
      dataIndex: 'account',
      valueType: 'text',
      sorter: true,
      render: (_, record) => {
        return showSensitiveInfo ? record.account : '****';
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.accountName' }),
      dataIndex: 'name',
      valueType: 'text',
      sorter: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.account.openDConnection' }),
      dataIndex: 'connected',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => {
        // 这里假设record中有connected字段表示连接状态
        const isConnected = record.connected === true;
        return (
          <span style={{ color: isConnected ? '#52c41a' : '#ff4d4f' }}>
            {isConnected 
              ? intl.formatMessage({ id: 'pages.account.connected' }) 
              : intl.formatMessage({ id: 'pages.account.disconnected' })}
          </span>
        );
      }
    },
    {
      title: intl.formatMessage({ id: 'pages.account.accId' }),
      dataIndex: 'accId',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => {
        return showSensitiveInfo ? record.accId : '****';
      },
    },

    {
      title: intl.formatMessage({ id: 'pages.account.availableAmount' }),
      dataIndex: 'availableAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
      render: (_, record) => {
        return showSensitiveInfo ? 
          `$${record.availableAmount?.toFixed(2) || '0.00'}` : 
          '****';
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.totalAmount' }),
      dataIndex: 'totalAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
      render: (_, record) => {
        return showSensitiveInfo ? 
          `$${record.totalAmount?.toFixed(2) || '0.00'}` : 
          '****';
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.marketValue' }),
      dataIndex: 'marketVal',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
      render: (_, record) => {
        return showSensitiveInfo ? 
          `$${record.marketVal?.toFixed(2) || '0.00'}` : 
          '****';
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.initialAmount' }),
      dataIndex: 'initAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
      render: (_, record) => {
        return showSensitiveInfo ? 
          `$${record.initAmount?.toFixed(2) || '0.00'}` : 
          '****';
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.maxUsageRatio' }),
      dataIndex: 'overPercent',
      valueType: 'percent',
      hideInSearch: true,
      sorter: true,
      render: (_, record) => `${(record.overPercent * 100).toFixed(2)}%`,
    },
    {
      title: intl.formatMessage({ id: 'pages.account.power', defaultMessage: '最大购买力' }),
      dataIndex: 'power',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      render: (_, record) => {
        return showSensitiveInfo ? `$${record.power?.toFixed(2) || '0.00'}` : '****';
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.cashAmount', defaultMessage: '现金总值' }),
      dataIndex: 'cashAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      render: (_, record) => {
        if (!showSensitiveInfo) return '****';
        const cashAmount = (record.totalAmount || 0) - (record.marketVal || 0);
        return `$${cashAmount.toFixed(2)}`;
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.stockRatio', defaultMessage: '股票占比' }),
      dataIndex: 'stockRatio',
      hideInSearch: true,
      render: (_, record) => {
        if (!showSensitiveInfo) return '****';
        const totalAmount = record.totalAmount || 0;
        const marketVal = record.marketVal || 0;
        const stockRatio = totalAmount > 0 ? (marketVal / totalAmount) * 100 : 0;
        const color = stockRatio > 80 ? '#ff4d4f' : stockRatio > 60 ? '#faad14' : '#52c41a';
        return <span style={{ color }}>{stockRatio.toFixed(2)}%</span>;
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.riskLevel' }),
      dataIndex: 'riskLevel',
      valueType: 'text',
      hideInSearch: true,
      valueEnum: {
        '-1': { text: intl.formatMessage({ id: 'pages.trade.risk.unknown' }), status: 'Default' },
        '0': { text: intl.formatMessage({ id: 'pages.trade.risk.safe' }), status: 'Success' },
        '1': { text: intl.formatMessage({ id: 'pages.trade.risk.warning' }), status: 'Warning' },
        '2': { text: intl.formatMessage({ id: 'pages.trade.risk.danger' }), status: 'Error' },
        '3': { text: intl.formatMessage({ id: 'pages.trade.risk.absolutelySafe' }), status: 'Success' },
        '4': { text: intl.formatMessage({ id: 'pages.trade.risk.danger' }), status: 'Error' },
      },
    },
    {
      title: intl.formatMessage({ id: 'pages.account.createTime' }),
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: intl.formatMessage({ id: 'pages.account.status' }),
      dataIndex: 'enable',
      valueType: 'switch',
      hideInSearch: true,
      render: (_, record) => (
        <Switch
          checked={record.enable}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          checkedChildren={intl.formatMessage({ id: 'pages.account.enabled.switch' })}
          unCheckedChildren={intl.formatMessage({ id: 'pages.account.disabled.switch' })}
        />
      )
    },
    {
      title: intl.formatMessage({ id: 'pages.account.operations' }),
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() => handleEditAccount(record)}
        >
          {intl.formatMessage({ id: 'pages.account.edit' })}
        </Button>,
        <Button
          key="startOpenD"
          type="link"
          onClick={() => handleStartOpenD(record.account)}
        >
          {intl.formatMessage({ id: 'pages.account.startOpenD' })}
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          onClick={() => handleDeleteAccount(record.id)}
        >
          {intl.formatMessage({ id: 'pages.account.delete' })}
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
        request={async (params, sort, filter) => {
          try {
            const response = await listAccountInfo(params, sort);
            console.log('ProTable收到的响应:', response);
            if (response && response.success) {
              return {
                data: response.data || [],
                total: response.total || 0,
                success: true,
              };
            }
            return {
              data: [],
              total: 0,
              success: false,
            };
          } catch (error) {
            console.error('获取账户列表失败:', error);
            return {
              data: [],
              total: 0,
              success: false,
            };
          }
        }}
        columns={columns}
        rowSelection={{
          onChange: (_, selectedRows) => {
            setSelectedRows(selectedRows);
          },
        }}
        toolBarRender={() => [
          <Button
            key="toggleSensitive"
            icon={showSensitiveInfo ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
          >
            {showSensitiveInfo ? 
              intl.formatMessage({ id: 'pages.account.hideSensitiveInfo' }) : 
              intl.formatMessage({ id: 'pages.account.showSensitiveInfo' })}
          </Button>,
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            {intl.formatMessage({ id: 'pages.account.create' })}
          </Button>,
        ]}
      />

      {/* 编辑账户表单 */}
      <ModalForm
        title={intl.formatMessage({ id: 'pages.account.editForm.title' })}
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
            submitText: intl.formatMessage({ id: 'pages.account.form.submit' }),
            resetText: intl.formatMessage({ id: 'pages.account.form.cancel' }),
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
            label={intl.formatMessage({ id: 'pages.account.accountId' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.accountIdPlaceholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.accountIdRequired' }) }]}
          />
          <ProFormText
            name="name"
            label={intl.formatMessage({ id: 'pages.account.accountName' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.accountNamePlaceholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.accountNameRequired' }) }]}
          />
          <ProFormText
            name="host"
            label={intl.formatMessage({ id: 'pages.account.host' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.hostPlaceholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.hostRequired' }) }]}
          />
          <ProFormDigit
            name="port"
            label={intl.formatMessage({ id: 'pages.account.port' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.portPlaceholder' })}
            min={1}
            max={65535}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.portRequired' }) }]}
          />
          <ProFormText.Password
            name="tradePassword"
            label={intl.formatMessage({ id: 'pages.account.tradePassword' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.tradePasswordPlaceholder' })}
            rules={[{ required: false, message: intl.formatMessage({ id: 'pages.account.form.tradePasswordRequired' }) }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
            tooltip={intl.formatMessage({ id: 'pages.account.form.tradePasswordTooltip' })}
          />
          <ProFormText.Password
            name="loginPassword"
            label={intl.formatMessage({ id: 'pages.account.loginPassword' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.loginPasswordPlaceholder' })}
            rules={[{ required: false, message: intl.formatMessage({ id: 'pages.account.form.loginPasswordRequired' }) }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
            tooltip={intl.formatMessage({ id: 'pages.account.form.loginPasswordTooltip' })}
          />
          <ProFormDigit
            name="overPercent"
            label={intl.formatMessage({ id: 'pages.account.maxUsageRatio' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.maxUsageRatioPlaceholder' })}
            min={0}
            max={200}
            fieldProps={{
              precision: 2,
              step: 1,
              formatter: (value) => `${value}%`,
              parser: (value) => value ? parseFloat(value.replace('%', '')) : 0,
            }}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.maxUsageRatioRequired' }) }]}
          />
          <ProFormDigit
            name="initAmount"
            label={intl.formatMessage({ id: 'pages.account.initialAmount' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.initialAmountPlaceholder' })}
            min={0}
            fieldProps={{
              precision: 2,
              step: 0.01,
            }}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.initialAmountRequired' }) }]}
          />
          <ProFormSwitch
            name="master"
            label={intl.formatMessage({ id: 'pages.account.master' })}
            checkedChildren={intl.formatMessage({ id: 'pages.account.form.masterCheckedChildren' })}
            unCheckedChildren={intl.formatMessage({ id: 'pages.account.form.masterUncheckedChildren' })}
          />
          <Form.Item noStyle dependencies={['master']}>
            {({ getFieldValue }) => (
              <ProFormText
                name="follow"
                label={intl.formatMessage({ id: 'pages.account.follow' })}
                placeholder={intl.formatMessage({ id: 'pages.account.form.followPlaceholder' })}
                disabled={getFieldValue('master')}
              />
            )}
          </Form.Item>
          <ProFormText
            name="accId"
            label={intl.formatMessage({ id: 'pages.account.accId' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.accIdPlaceholder' })}
            tooltip={intl.formatMessage({ id: 'pages.account.form.accIdTooltip' })}
            rules={[{ required: false }]}
          />
        </ProForm.Group>
      </ModalForm>

      {/* 创建账户表单 */}
      <ModalForm
        title={intl.formatMessage({ id: 'pages.account.createForm.title' })}
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
        submitter={{
          searchConfig: {
            submitText: intl.formatMessage({ id: 'pages.account.form.submit' }),
            resetText: intl.formatMessage({ id: 'pages.account.form.cancel' }),
          },
        }}
      >
        <ProForm.Group>
          <ProFormText
            name="account"
            label={intl.formatMessage({ id: 'pages.account.accountId' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.accountIdPlaceholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.accountIdRequired' }) }]}
          />
          <ProFormText
            name="name"
            label={intl.formatMessage({ id: 'pages.account.accountName' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.accountNamePlaceholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.accountNameRequired' }) }]}
          />
          <ProFormText
            name="host"
            label={intl.formatMessage({ id: 'pages.account.host' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.hostPlaceholder' })}
            initialValue="127.0.0.1"
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.hostRequired' }) }]}
          />
          <ProFormDigit
            name="port"
            label={intl.formatMessage({ id: 'pages.account.port' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.portPlaceholder' })}
            min={1}
            max={65535}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.portRequired' }) }]}
          />
          <ProFormText.Password
            name="tradePassword"
            label={intl.formatMessage({ id: 'pages.account.tradePassword' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.tradePasswordPlaceholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.tradePasswordRequired' }) }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
          />
          <ProFormText.Password
            name="loginPassword"
            label={intl.formatMessage({ id: 'pages.account.loginPassword' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.loginPasswordPlaceholder' })}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.loginPasswordRequired' }) }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
          />
          <ProFormDigit
            name="overPercent"
            label={intl.formatMessage({ id: 'pages.account.maxUsageRatio' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.maxUsageRatioPlaceholder' })}
            min={0}
            max={200}
            fieldProps={{
              precision: 2,
              step: 1,
              formatter: (value) => `${value}%`,
              parser: (value) => value ? parseFloat(value.replace('%', '')) : 0,
            }}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.maxUsageRatioRequired' }) }]}
          />
          <ProFormDigit
            name="initAmount"
            label={intl.formatMessage({ id: 'pages.account.initialAmount' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.initialAmountPlaceholder' })}
            min={0}
            fieldProps={{
              precision: 2,
              step: 0.01,
            }}
            rules={[{ required: true, message: intl.formatMessage({ id: 'pages.account.form.initialAmountRequired' }) }]}
          />
          <ProFormSwitch
            name="master"
            label={intl.formatMessage({ id: 'pages.account.master' })}
            checkedChildren={intl.formatMessage({ id: 'pages.account.form.masterCheckedChildren' })}
            unCheckedChildren={intl.formatMessage({ id: 'pages.account.form.masterUncheckedChildren' })}
            initialValue={true}
          />
          <Form.Item noStyle dependencies={['master']}>
            {({ getFieldValue }) => (
              <ProFormText
                name="follow"
                label={intl.formatMessage({ id: 'pages.account.follow' })}
                placeholder={intl.formatMessage({ id: 'pages.account.form.followPlaceholder' })}
                disabled={getFieldValue('master')}
              />
            )}
          </Form.Item>
          <ProFormText
            name="accId"
            label={intl.formatMessage({ id: 'pages.account.accId' })}
            placeholder={intl.formatMessage({ id: 'pages.account.form.accIdPlaceholder' })}
            tooltip={intl.formatMessage({ id: 'pages.account.form.accIdTooltip' })}
            rules={[{ required: false }]}
          />
        </ProForm.Group>
      </ModalForm>
    </PageContainer>
  );
};

export default TableList;