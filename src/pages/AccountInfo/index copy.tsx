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
        message.success(enable ? 
          intl.formatMessage({id: 'pages.account.enabled', defaultMessage: '账户已启用'}) : 
          intl.formatMessage({id: 'pages.account.disabled', defaultMessage: '账户已禁用'})
        );
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
      } else {
        message.error(response.message || intl.formatMessage({id: 'pages.account.operationFailed', defaultMessage: '操作失败'}));
      }
    } catch (error) {
      message.error(intl.formatMessage({id: 'pages.account.requestFailed', defaultMessage: '操作请求失败'}));
      console.error('操作错误:', error);
    }
  };

  // 处理删除账户
  const handleDeleteAccount = async (id: number) => {
    Modal.confirm({
      title: intl.formatMessage({id: 'pages.account.confirmDelete', defaultMessage: '确认删除'}),
      content: intl.formatMessage({id: 'pages.account.confirmDeleteContent', defaultMessage: '确定要删除此账户吗？此操作不可恢复。'}),
      onOk: async () => {
        try {
          // 调用删除账户API
          const response = await deleteAccountInfo(id);
          
          if (response.success) {
            message.success(intl.formatMessage({id: 'pages.account.deleteSuccess', defaultMessage: '账户已删除'}));
            // 刷新表格数据
            if (actionRef.current) {
              actionRef.current.reload();
            }
          } else {
            message.error(response.message || intl.formatMessage({id: 'pages.account.deleteFailed', defaultMessage: '删除失败'}));
          }
        } catch (error) {
          message.error(intl.formatMessage({id: 'pages.account.deleteRequestFailed', defaultMessage: '删除请求失败'}));
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
        message.success(intl.formatMessage({id: 'pages.account.updateSuccess', defaultMessage: '账户信息已更新'}));
        setEditModalVisible(false);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(response.message || intl.formatMessage({id: 'pages.account.updateFailed', defaultMessage: '更新失败'}));
        return false;
      }
    } catch (error) {
      message.error(intl.formatMessage({id: 'pages.account.updateRequestFailed', defaultMessage: '更新请求失败'}));
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
        message.success(intl.formatMessage({id: 'pages.account.createSuccess', defaultMessage: '账户创建成功'}));
        setCreateModalVisible(false);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(response.message || intl.formatMessage({id: 'pages.account.createFailed', defaultMessage: '创建失败'}));
        return false;
      }
    } catch (error) {
      message.error(intl.formatMessage({id: 'pages.account.createRequestFailed', defaultMessage: '创建请求失败'}));
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
        message.success(intl.formatMessage({id: 'pages.account.generateConfigSuccess', defaultMessage: '配置文件生成成功'}));
      } else {
        message.error(response.message || intl.formatMessage({id: 'pages.account.generateConfigFailed', defaultMessage: '生成配置失败'}));
      }
    } catch (error) {
      message.error(intl.formatMessage({id: 'pages.account.generateConfigRequestFailed', defaultMessage: '生成配置请求失败'}));
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
        message.success(intl.formatMessage({id: 'pages.account.startOpenDSuccess', defaultMessage: 'OpenD已启动成功'}));
      } else {
        message.error(response.message || intl.formatMessage({id: 'pages.account.startOpenDFailed', defaultMessage: '启动OpenD失败'}));
      }
    } catch (error) {
      message.error(intl.formatMessage({id: 'pages.account.startOpenDRequestFailed', defaultMessage: '启动OpenD请求失败'}));
      console.error('启动OpenD错误:', error);
    }
  };

  const columns: ProColumns[] = [
    {
      title: <FormattedMessage id="pages.account.accountId" defaultMessage="牛牛号" />,
      dataIndex: 'account',
      valueType: 'text',
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.account.accountName" defaultMessage="账户别名" />,
      dataIndex: 'name',
      valueType: 'text',
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.account.openDConnection" defaultMessage="是否连接OpenD" />,
      dataIndex: 'connected',
      valueType: 'text',
      hideInSearch: true,
      render: (_, record) => {
        // 这里假设record中有connected字段表示连接状态
        const isConnected = record.connected === true;
        return (
          <span style={{ color: isConnected ? '#52c41a' : '#ff4d4f' }}>
            {isConnected ? 
              <FormattedMessage id="pages.account.connected" defaultMessage="已连接" /> : 
              <FormattedMessage id="pages.account.disconnected" defaultMessage="未连接" />
            }
          </span>
        );
      }
    },
    {
      title: <FormattedMessage id="pages.account.accId" defaultMessage="资金账户ID" />,
      dataIndex: 'accId',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: <FormattedMessage id="pages.account.availableAmount" defaultMessage="可用资金" />,
      dataIndex: 'availableAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.account.totalAmount" defaultMessage="总资产" />,
      dataIndex: 'totalAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.account.marketValue" defaultMessage="证券市值" />,
      dataIndex: 'marketVal',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.account.initialAmount" defaultMessage="初始资金" />,
      dataIndex: 'initAmount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.account.maxUsageRatio" defaultMessage="最大使用资金占比" />,
      dataIndex: 'overPercent',
      valueType: 'percent',
      hideInSearch: true,
      sorter: true,
      render: (_, record) => `${(record.overPercent * 100).toFixed(2)}%`,
    },
    {
      title: <FormattedMessage id="pages.account.buyingPower" defaultMessage="购买力" />,
      dataIndex: 'power',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.account.riskLevel" defaultMessage="风险等级" />,
      dataIndex: 'riskLevel',
      valueType: 'text',
      hideInSearch: true,
      valueEnum: {
        '-1': { text: <FormattedMessage id="pages.trade.risk.unknown" defaultMessage="未知" />, status: 'Default' },
        '0': { text: <FormattedMessage id="pages.trade.risk.safe" defaultMessage="安全" />, status: 'Success' },
        '1': { text: <FormattedMessage id="pages.trade.risk.warning" defaultMessage="警告" />, status: 'Warning' },
        '2': { text: <FormattedMessage id="pages.trade.risk.danger" defaultMessage="危险" />, status: 'Error' },
        '3': { text: <FormattedMessage id="pages.trade.risk.absolutelySafe" defaultMessage="绝对安全" />, status: 'Success' },
        '4': { text: <FormattedMessage id="pages.trade.risk.danger" defaultMessage="危险" />, status: 'Error' },
      },
    },
    {
      title: <FormattedMessage id="pages.account.createTime" defaultMessage="创建时间" />,
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: <FormattedMessage id="pages.account.status" defaultMessage="状态" />,
      dataIndex: 'enable',
      valueType: 'switch',
      hideInSearch: true,
      render: (_, record) => (
        <Switch
          checked={record.enable}
          onChange={(checked) => handleToggleStatus(record.id, checked)}
          checkedChildren={<FormattedMessage id="pages.account.enabled.switch" defaultMessage="启用" />}
          unCheckedChildren={<FormattedMessage id="pages.account.disabled.switch" defaultMessage="禁用" />}
        />
      )
    },
    {
      title: <FormattedMessage id="pages.account.operations" defaultMessage="操作" />,
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() => handleEditAccount(record)}
        >
          <FormattedMessage id="pages.account.edit" defaultMessage="编辑" />
        </Button>,
        <Button
          key="startOpenD"
          type="link"
          onClick={() => handleStartOpenD(record.account)}
        >
          <FormattedMessage id="pages.account.startOpenD" defaultMessage="启动OpenD" />
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          onClick={() => handleDeleteAccount(record.id)}
        >
          <FormattedMessage id="pages.account.delete" defaultMessage="删除" />
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
          console.log('请求参数:', params, sort); // 添加日志
          try {
            const response = await listAccountInfo(params, sort);
            console.log('API返回结果:', response); // 添加日志查看实际返回值
            
            // 检查返回值是否有效
            if (response && response.data) {
              // 直接返回符合ProTable预期的数据结构
              return {
                data: response.data?.list || [],
                success: true,
                total: response.data?.total || 0
              };
            }
            
            // 默认返回空数据
            return {
              data: [],
              success: false,
              total: 0
            };
          } catch (error) {
            console.error('获取账户列表失败:', error);
            return {
              data: [],
              success: false,
              total: 0
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
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            <FormattedMessage id="pages.account.create" defaultMessage="新建" />
          </Button>,
        ]}
      />

      {/* 编辑账户表单 */}
      <ModalForm
        title={intl.formatMessage({id: 'pages.account.editForm.title', defaultMessage: '编辑账户信息'})}
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
            submitText: intl.formatMessage({id: 'pages.account.form.submit', defaultMessage: '确认'}),
            resetText: intl.formatMessage({id: 'pages.account.form.cancel', defaultMessage: '取消'}),
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
            label={intl.formatMessage({id: 'pages.account.accountId', defaultMessage: '牛牛号'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.accountIdPlaceholder', defaultMessage: '请输入牛牛号'})}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.accountIdRequired', defaultMessage: '请输入牛牛号'}) }]}
          />
          <ProFormText
            name="name"
            label={intl.formatMessage({id: 'pages.account.accountName', defaultMessage: '账户别名'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.accountNamePlaceholder', defaultMessage: '请输入账户别名'})}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.accountNameRequired', defaultMessage: '请输入账户别名'}) }]}
          />
          <ProFormText
            name="host"
            label={intl.formatMessage({id: 'pages.account.host', defaultMessage: '主机地址'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.hostPlaceholder', defaultMessage: '请输入主机地址'})}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.hostRequired', defaultMessage: '请输入主机地址'}) }]}
          />
          <ProFormDigit
            name="port"
            label={intl.formatMessage({id: 'pages.account.port', defaultMessage: '端口'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.portPlaceholder', defaultMessage: '请输入端口'})}
            min={1}
            max={65535}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.portRequired', defaultMessage: '请输入端口'}) }]}
          />
          <ProFormText.Password
            name="tradePassword"
            label={intl.formatMessage({id: 'pages.account.tradePassword', defaultMessage: '交易密码'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.tradePasswordPlaceholder', defaultMessage: '请输入交易密码（将进行MD5加密）'})}
            rules={[{ required: false, message: intl.formatMessage({id: 'pages.account.form.tradePasswordRequired', defaultMessage: '请输入交易密码'}) }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
            tooltip={intl.formatMessage({id: 'pages.account.form.tradePasswordTooltip', defaultMessage: '不填写则不会更新交易密码'})}
          />
          <ProFormText.Password
            name="loginPassword"
            label={intl.formatMessage({id: 'pages.account.loginPassword', defaultMessage: '登录密码'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.loginPasswordPlaceholder', defaultMessage: '请输入登录密码（将进行MD5加密）'})}
            rules={[{ required: false, message: intl.formatMessage({id: 'pages.account.form.loginPasswordRequired', defaultMessage: '请输入登录密码'}) }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
            tooltip={intl.formatMessage({id: 'pages.account.form.loginPasswordTooltip', defaultMessage: '不填写则不会更新登录密码'})}
          />
          <ProFormDigit
            name="overPercent"
            label={intl.formatMessage({id: 'pages.account.maxUsageRatio', defaultMessage: '最大使用资金占比(%)'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.maxUsageRatioPlaceholder', defaultMessage: '请输入最大使用资金占比'})}
            min={0}
            max={200}
            fieldProps={{
              precision: 2,
              step: 1,
              formatter: (value) => `${value}%`,
              parser: (value) => value ? parseFloat(value.replace('%', '')) : 0,
            }}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.maxUsageRatioRequired', defaultMessage: '请输入最大使用资金占比'}) }]}
          />
          <ProFormDigit
            name="initAmount"
            label={intl.formatMessage({id: 'pages.account.initialAmount', defaultMessage: '初始资金'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.initialAmountPlaceholder', defaultMessage: '请输入初始资金'})}
            min={0}
            fieldProps={{
              precision: 2,
              step: 0.01,
            }}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.initialAmountRequired', defaultMessage: '请输入初始资金'}) }]}
          />
          <ProFormSwitch
            name="master"
            label={intl.formatMessage({id: 'pages.account.master', defaultMessage: '主账户'})}
            checkedChildren={intl.formatMessage({id: 'pages.account.form.masterCheckedChildren', defaultMessage: '是'})}
            unCheckedChildren={intl.formatMessage({id: 'pages.account.form.masterUncheckedChildren', defaultMessage: '否'})}
          />
          <Form.Item noStyle dependencies={['master']}>
            {({ getFieldValue }) => (
              <ProFormText
                name="follow"
                label={intl.formatMessage({id: 'pages.account.follow', defaultMessage: '跟单账户'})}
                placeholder={intl.formatMessage({id: 'pages.account.form.followPlaceholder', defaultMessage: '请输入跟单账户ID'})}
                disabled={getFieldValue('master')}
              />
            )}
          </Form.Item>
          <ProFormText
            name="accId"
            label={intl.formatMessage({id: 'pages.account.accId', defaultMessage: '资金账户ID(默认自动获取)'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.accIdPlaceholder', defaultMessage: '请输入资金账户ID'})}
            tooltip={intl.formatMessage({id: 'pages.account.form.accIdTooltip', defaultMessage: '资金账户ID为可选字段'})}
            rules={[{ required: false }]}
          />
        </ProForm.Group>
      </ModalForm>

      {/* 创建账户表单 */}
      <ModalForm
        title={intl.formatMessage({id: 'pages.account.createForm.title', defaultMessage: '创建新账户'})}
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
            label={intl.formatMessage({id: 'pages.account.accountId', defaultMessage: '牛牛号'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.accountIdPlaceholder', defaultMessage: '请输入牛牛号'})}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.accountIdRequired', defaultMessage: '请输入牛牛号'}) }]}
          />
          <ProFormText
            name="name"
            label={intl.formatMessage({id: 'pages.account.accountName', defaultMessage: '账户别名'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.accountNamePlaceholder', defaultMessage: '请输入账户别名'})}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.accountNameRequired', defaultMessage: '请输入账户别名'}) }]}
          />
          <ProFormText
            name="host"
            label={intl.formatMessage({id: 'pages.account.host', defaultMessage: '主机地址'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.hostPlaceholder', defaultMessage: '请输入主机地址'})}
            initialValue="127.0.0.1"
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.hostRequired', defaultMessage: '请输入主机地址'}) }]}
          />
          <ProFormDigit
            name="port"
            label={intl.formatMessage({id: 'pages.account.port', defaultMessage: '端口'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.portPlaceholder', defaultMessage: '请输入端口'})}
            min={1}
            max={65535}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.portRequired', defaultMessage: '请输入端口'}) }]}
          />
          <ProFormText.Password
            name="tradePassword"
            label={intl.formatMessage({id: 'pages.account.tradePassword', defaultMessage: '交易密码'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.tradePasswordPlaceholder', defaultMessage: '请输入交易密码（将进行MD5加密）'})}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.tradePasswordRequired', defaultMessage: '请输入交易密码'}) }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
          />
          <ProFormText.Password
            name="loginPassword"
            label={intl.formatMessage({id: 'pages.account.loginPassword', defaultMessage: '登录密码'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.loginPasswordPlaceholder', defaultMessage: '请输入登录密码（将进行MD5加密）'})}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.loginPasswordRequired', defaultMessage: '请输入登录密码'}) }]}
            fieldProps={{
              autoComplete: 'new-password',
            }}
          />
          <ProFormDigit
            name="overPercent"
            label={intl.formatMessage({id: 'pages.account.maxUsageRatio', defaultMessage: '最大使用资金占比(%)'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.maxUsageRatioPlaceholder', defaultMessage: '请输入最大使用资金占比'})}
            min={0}
            max={200}
            fieldProps={{
              precision: 2,
              step: 1,
              formatter: (value) => `${value}%`,
              parser: (value) => value ? parseFloat(value.replace('%', '')) : 0,
            }}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.maxUsageRatioRequired', defaultMessage: '请输入最大使用资金占比'}) }]}
          />
          <ProFormDigit
            name="initAmount"
            label={intl.formatMessage({id: 'pages.account.initialAmount', defaultMessage: '初始资金（美金）'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.initialAmountPlaceholder', defaultMessage: '请输入初始资金'})}
            min={0}
            fieldProps={{
              precision: 2,
              step: 0.01,
            }}
            rules={[{ required: true, message: intl.formatMessage({id: 'pages.account.form.initialAmountRequired', defaultMessage: '请输入初始资金'}) }]}
          />
          <ProFormSwitch
            name="master"
            label={intl.formatMessage({id: 'pages.account.master', defaultMessage: '主账户'})}
            checkedChildren={intl.formatMessage({id: 'pages.account.form.masterCheckedChildren', defaultMessage: '是'})}
            unCheckedChildren={intl.formatMessage({id: 'pages.account.form.masterUncheckedChildren', defaultMessage: '否'})}
            initialValue={true}
          />
          <Form.Item noStyle dependencies={['master']}>
            {({ getFieldValue }) => (
              <ProFormText
                name="follow"
                label={intl.formatMessage({id: 'pages.account.follow', defaultMessage: '跟单账户'})}
                placeholder={intl.formatMessage({id: 'pages.account.form.followPlaceholder', defaultMessage: '请输入跟单账户ID'})}
                disabled={getFieldValue('master')}
              />
            )}
          </Form.Item>
          <ProFormText
            name="accId"
            label={intl.formatMessage({id: 'pages.account.accId', defaultMessage: '资金账户ID(默认自动获取)'})}
            placeholder={intl.formatMessage({id: 'pages.account.form.accIdPlaceholder', defaultMessage: '请输入资金账户ID'})}
            tooltip={intl.formatMessage({id: 'pages.account.form.accIdTooltip', defaultMessage: '资金账户ID为可选字段'})}
            rules={[{ required: false }]}
          />
        </ProForm.Group>
      </ModalForm>
    </PageContainer>
  );
};

export default TableList;