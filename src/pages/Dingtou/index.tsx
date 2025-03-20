import {createDingtou, deleteDingtou, fetchDingtouList, updateDingtou, updateDingtouStatus} from '@/services/ant-design-pro/api';
import type {ActionType, ProColumns} from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProForm,
  ProFormText,
  ProFormDigit,
  ProFormSwitch,
  ProFormDateTimePicker,
  ProTable,
} from '@ant-design/pro-components';
import {useIntl} from '@umijs/max';
import {Button, Form, InputNumber, Modal, Switch, message} from 'antd';
import React, {useRef, useState} from 'react';
import { Dingtou } from '@/models/dingtou';

const DingtouList: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [selectedRowsState, setSelectedRows] = useState<Dingtou[]>([]);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [currentDingtou, setCurrentDingtou] = useState<Dingtou | undefined>(undefined);
  const [form] = Form.useForm();

  /**
   * 国际化配置
   */
  const intl = useIntl();

  // 处理启用/禁用定投
  const handleToggleStatus = async (id: number, enable: boolean) => {
    try {
      // 调用更新定投状态API
      const response = await updateDingtouStatus({
        id,
        enable
      });
      
      if (response && response.data === true) {
        message.success(enable ? '定投已启用' : '定投已禁用');
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
      } else {
        message.error(response?.message || '操作失败');
      }
    } catch (error) {
      message.error('操作请求失败');
      console.error('操作错误:', error);
    }
  };

  // 处理删除定投
  const handleDeleteDingtou = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除此定投计划吗？此操作不可恢复。',
      onOk: async () => {
        try {
          // 调用删除定投API
          const response = await deleteDingtou(id);
          
          if (response && response.data === true) {
            message.success('定投计划已删除');
            // 刷新表格数据
            if (actionRef.current) {
              actionRef.current.reload();
            }
          } else {
            message.error(response?.message || '删除失败');
          }
        } catch (error) {
          message.error('删除请求失败');
          console.error('删除错误:', error);
        }
      }
    });
  };

  // 处理编辑定投
  const handleEditDingtou = (record: Dingtou) => {
    form.setFieldsValue(record);  // 先设置表单值
    setCurrentDingtou(record);  // 设置当前定投记录
    setEditModalVisible(true);  // 最后打开模态框
  };

  // 处理更新定投信息
  const handleUpdateDingtou = async (values: any) => {
    if (!currentDingtou) return false;
    
    // 验证定投比例和固定金额不能同时为空
    // if ((values.rate === undefined || values.rate === null || values.rate === 0) &&
    //     (values.amount === undefined || values.amount === null || values.amount === 0)) {
    //   message.error('每次定投比例和固定金额不能同时为空');
    //   return false;
    // }
    
    try {
      const response = await updateDingtou({
        id: currentDingtou.id,
        ...values
      });
      
      if (response && response.data === true) {
        message.success('定投信息已更新');
        setEditModalVisible(false);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(response?.message || '更新失败');
        return false;
      }
    } catch (error) {
      message.error('更新请求失败');
      console.error('更新错误:', error);
      return false;
    }
  };

  // 处理创建定投
  const handleCreateDingtou = async (values: any) => {
    // 验证定投比例和固定金额不能同时为空
    // if ((values.rate === undefined || values.rate === null || values.rate === 0) &&
    //     (values.amount === undefined || values.amount === null || values.amount === 0)) {
    //   message.error('每次定投比例和固定金额不能同时为空');
    //   return false;
    // }
    
    try {
      const response = await createDingtou(values);
      
      if (response && response.data === true) {
        message.success('定投计划创建成功');
        setCreateModalVisible(false);
        // 刷新表格数据
        if (actionRef.current) {
          actionRef.current.reload();
        }
        return true;
      } else {
        message.error(response?.message || '创建失败');
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
      title: '交易账号',
      dataIndex: 'account',
      valueType: 'text',
      sorter: true,
    },
    {
      title: '股票代码',
      dataIndex: 'code',
      valueType: 'text',
      sorter: true,
    },
    {
      title: '上次定投时间',
      dataIndex: 'lastTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '已定投次数',
      dataIndex: 'alreadyTimes',
      valueType: 'digit',
      hideInSearch: true,
    },
    {
      title: '计划定投次数',
      dataIndex: 'allTimes',
      valueType: 'digit',
      hideInSearch: true,
    },
    {
      title: '每次定投比例(%)',
      dataIndex: 'rate',
      valueType: 'percent',
      hideInSearch: true,
      renderText: (val: number) =>
        val === null || val === undefined ? '-' : `${val * 100}%`,
    },
    {
      title: '固定定投金额(美金)',
      dataIndex: 'amount',
      valueType: {
        type: 'money',
        locale: 'en-US',
      },
      hideInSearch: true,
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
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          onClick={() => handleEditDingtou(record)}
        >
          编辑
        </Button>,
        <Switch
          key="toggle"
          checked={record.enable}
          onChange={(checked) => handleToggleStatus(record.id!, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />,
        <Button
          key="delete"
          type="primary"
          danger
          onClick={() => handleDeleteDingtou(record.id!)}
        >
          删除
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer>
      <div style={{ marginBottom: 16, padding: '16px 24px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ marginBottom: 8, fontWeight: 'bold' }}>定投时间为每周五收盘前10分钟，单次定投金额, 计算方式优先级如下：</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>1. 如果设置了每次定投比例，按总资金比例计算，如果计算结果大于设置的固定定投金额，使用计算结果，否则使用设置的固定定投金额。</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>2. 如果没有设置定投比例，只设置了固定定投金额，直接使用定投金额。</p>
        <p style={{ paddingLeft: 16 }}>3. 如果都没设置，使用默认的计算方式，单次金额 = 可用金额 ➗ 剩余定投次数 ➗ 定投股票数</p>
        <p style={{ paddingLeft: 16 }}>4. 如果最终计算的金额少于当前股价，取消这次定投</p>
      </div>
      <ProTable
        headerTitle={intl.formatMessage({
          id: 'pages.searchTable.dingtouList',
          defaultMessage: '定投列表',
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
            新建定投
          </Button>,
        ]}
        request={fetchDingtouList}
        columns={columns}
        polling={undefined}
        revalidateOnFocus={true}
        debounceTime={0}
        options={{
          reload: true,
        }}
        key={JSON.stringify(selectedRowsState) + new Date().getTime()}
      />

      {/* 编辑定投表单 */}
      <ModalForm
        title="编辑定投信息(每周五收盘前10分钟执行定投)"
        width={500}
        open={editModalVisible}
        onOpenChange={(visible) => {
          setEditModalVisible(visible);
          if (!visible) {
            form.resetFields();
            setCurrentDingtou(undefined);
          }
        }}
        onFinish={handleUpdateDingtou}
        initialValues={currentDingtou}
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
            label="交易账号"
            placeholder="请输入交易账号"
            rules={[{ required: true, message: '请输入交易账号' }]}
          />
          <ProFormText
            name="code"
            label="股票代码"
            placeholder="请输入股票代码"
            rules={[{ required: true, message: '请输入股票代码' }]}
          />
          <ProFormDigit
            name="allTimes"
            label="计划定投次数"
            placeholder="请输入计划定投次数"
            min={1}
            initialValue={144}
            rules={[{ required: true, message: '请输入计划定投次数' }]}
          />
          <Form.Item
            dependencies={['amount']}
            name="rate"
            label="每次定投比例"
            // rules={[
            //   ({ getFieldValue }) => ({
            //     validator(_, value) {
            //       const amount = getFieldValue('amount');
            //       if ((value === undefined || value === null || value === 0) &&
            //           (amount === undefined || amount === null || amount === 0)) {
            //         return Promise.reject(new Error('定投比例和固定金额不能同时为空'));
            //       }
            //       return Promise.resolve();
            //     },
            //   }),
            // ]}
          >
            <ProFormDigit
              name="rate"
              noStyle
              min={0}
              max={1}
              step={0.01}
              placeholder="请输入定投比例"
              fieldProps={{
                formatter: (value) => `${(value || 0) * 100}%`,
                parser: (value) => (value ? parseFloat(value.replace('%', '')) / 100 : 0),
              }}
            />
          </Form.Item>
          <Form.Item
            dependencies={['rate']}
            name="amount"
            label="定投固定金额(美金)"
            // rules={[
            //   ({ getFieldValue }) => ({
            //     validator(_, value) {
            //       const rate = getFieldValue('rate');
            //       if ((value === undefined || value === null || value === 0) &&
            //           (rate === undefined || rate === null || rate === 0)) {
            //         return Promise.reject(new Error('定投比例和固定金额不能同时为空'));
            //       }
            //       return Promise.resolve();
            //     },
            //   }),
            // ]}
          >
            <ProFormDigit
              name="amount"
              noStyle
              min={0}
              precision={2}
              placeholder="请输入定投固定金额"
            />
          </Form.Item>
          <ProFormSwitch
            name="enable"
            label="是否启用"
            checkedChildren="启用"
            unCheckedChildren="禁用"
            initialValue={true}
          />
        </ProForm.Group>
      </ModalForm>

      {/* 创建定投表单 */}
      <ModalForm
        title="创建新定投(每周五收盘前10分钟执行定投)"
        width={500}
        open={createModalVisible}
        onOpenChange={setCreateModalVisible}
        onFinish={handleCreateDingtou}
        initialValues={{
          allTimes: 144,
          enable: true
        }}
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
            label="交易账号"
            placeholder="请输入交易账号"
            rules={[{ required: true, message: '请输入交易账号' }]}
          />
          <ProFormText
            name="code"
            label="股票代码"
            placeholder="请输入股票代码"
            rules={[{ required: true, message: '请输入股票代码' }]}
          />
          <ProFormDigit
            name="allTimes"
            label="计划定投次数"
            placeholder="请输入计划定投次数"
            min={1}
            initialValue={144}
            rules={[{ required: true, message: '请输入计划定投次数' }]}
          />
          <Form.Item
            dependencies={['amount']}
            name="rate"
            label="定投比例"
            // rules={[
            //   ({ getFieldValue }) => ({
            //     validator(_, value) {
            //       const amount = getFieldValue('amount');
            //       if ((value === undefined || value === null || value === 0) &&
            //           (amount === undefined || amount === null || amount === 0)) {
            //         return Promise.reject(new Error('定投比例和固定金额不能同时为空'));
            //       }
            //       return Promise.resolve();
            //     },
            //   }),
            // ]}
          >
            <ProFormDigit
              name="rate"
              noStyle
              min={0}
              max={1}
              step={0.01}
              placeholder="请输入定投比例"
              fieldProps={{
                formatter: (value) => `${(value || 0) * 100}%`,
                parser: (value) => (value ? parseFloat(value.replace('%', '')) / 100 : 0),
              }}
            />
          </Form.Item>
          <Form.Item
            dependencies={['rate']}
            name="amount"
            label="定投固定金额(美金)"
            // rules={[
            //   ({ getFieldValue }) => ({
            //     validator(_, value) {
            //       const rate = getFieldValue('rate');
            //       if ((value === undefined || value === null || value === 0) &&
            //           (rate === undefined || rate === null || rate === 0)) {
            //         return Promise.reject(new Error('定投比例和固定金额不能同时为空'));
            //       }
            //       return Promise.resolve();
            //     },
            //   }),
            // ]}
          >
            <ProFormDigit
              name="amount"
              noStyle
              min={0}
              precision={2}
              placeholder="请输入定投固定金额(美金)"
            />
          </Form.Item>
          <ProFormSwitch
            name="enable"
            label="是否启用"
            checkedChildren="启用"
            unCheckedChildren="禁用"
            initialValue={true}
          />
        </ProForm.Group>
      </ModalForm>
    </PageContainer>
  );
};

export default DingtouList;