import React, { useRef, useState } from 'react';
import { Button, message, Popconfirm, Tag, Modal, Space } from 'antd';
import {
  ActionType,
  ModalForm,
  ProColumns,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProFormDigit,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { 
  getConfigTemplateList,
  updateConfigTemplate,
  deleteConfigTemplate,
  getConfigTemplateById,
  listStrategyJob
} from '@/services/ant-design-pro/api';

/**
 * 策略配置模版管理组件
 */
const StrategyConfigTemplateManagement: React.FC = () => {
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.StrategyConfigTemplateItem>();
  const actionRef = useRef<ActionType>();
  const updateFormRef = useRef<any>();
  const intl = useIntl();

  // 更新配置模版
  const handleUpdate = async (fields: any) => {
    const hide = message.loading('更新中...');
    
    if (!currentRow) {
      hide();
      return false;
    }
    
    try {
      await updateConfigTemplate(currentRow.id!, fields);
      hide();
      message.success('更新成功');
      actionRef.current?.reload();
      return true;
    } catch (error) {
      hide();
      message.error('更新失败');
      return false;
    }
  };

  // 删除配置模版
  const handleDelete = async (record: API.StrategyConfigTemplateItem) => {
    const hide = message.loading('删除中...');
    
    try {
      await deleteConfigTemplate(record.id!);
      hide();
      message.success('删除成功');
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      // 显示详细的错误信息
      const errorMessage = error?.response?.data?.message || error?.message || '删除失败';
      message.error({
        content: errorMessage,
        duration: 6, // 显示6秒，因为错误信息可能比较长
        style: {
          whiteSpace: 'pre-line', // 支持换行显示
        },
      });
      return false;
    }
  };

  // 查看配置详情
  const handleViewConfig = (record: API.StrategyConfigTemplateItem) => {
    if (!record.configJson) {
      message.warning('该模版没有配置数据');
      return;
    }

    try {
      const config = JSON.parse(record.configJson);
      Modal.info({
        title: `配置模版详情 - ${record.name}`,
        width: 800,
        content: (
          <div>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: 16, 
              borderRadius: 4, 
              maxHeight: 400, 
              overflow: 'auto' 
            }}>
              {JSON.stringify(config, null, 2)}
            </pre>
          </div>
        ),
      });
    } catch (error) {
      message.error('配置数据格式错误');
    }
  };

  // 表格列定义
  const columns: ProColumns<API.StrategyConfigTemplateItem>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInSearch: true,
      width: 80,
      sorter: true,
    },
    {
      title: '模版名称',
      dataIndex: 'name',
      sorter: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.applicableScenario && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: 2 }}>
              {record.applicableScenario}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '配置类型',
      dataIndex: 'configType',
      valueEnum: {
        'user_stock': '策略用户股票关系',
        'strategy_stock': '策略标的',
      },
      render: (_, record) => (
        <Tag color={record.configType === 'user_stock' ? 'blue' : 'green'}>
          {record.configType === 'user_stock' ? '策略用户股票关系' : '策略标的'}
        </Tag>
      ),
    },
    {
      title: '行情类型',
      dataIndex: 'marketCondition',
      hideInSearch: true,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: '波动范围',
      dataIndex: 'volatilityRange',
      hideInSearch: true,
      render: (text) => text ? <Tag color="green">{text}</Tag> : '-',
    },
    {
      title: '策略ID',
      dataIndex: 'strategyId',
      hideInSearch: true,
      render: (text) => text || '-',
    },
    {
      title: '来源股票代码',
      dataIndex: 'sourceStockCode',
      hideInSearch: true,
      render: (text) => text || '-',
    },
    {
      title: '市值范围（亿美元）',
      hideInSearch: true,
      render: (_, record) => {
        if (!record.minMarketCap && !record.maxMarketCap) {
          return '-';
        }
        return `${record.minMarketCap || 0} - ${record.maxMarketCap || '∞'}`;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
      width: 160,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInSearch: true,
      sorter: true,
      width: 160,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <a
          key="edit"
          onClick={async () => {
            try {
              const response = await getConfigTemplateById(record.id!);
              if (response.success && response.data) {
                setCurrentRow(response.data);
                setUpdateModalVisible(true);
              }
            } catch (error) {
              message.error('获取模版信息失败');
            }
          }}
        >
          <EditOutlined /> 编辑
        </a>,
        <a
          key="view"
          onClick={() => handleViewConfig(record)}
        >
          查看配置
        </a>,
        <Popconfirm
          key="delete"
          title="确定要删除这个模版吗？"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <a style={{ color: '#ff4d4f' }}>
            <DeleteOutlined /> 删除
          </a>
        </Popconfirm>
      ],
    },
  ];

  return (
    <>
      <ProTable<API.StrategyConfigTemplateItem, API.PageParams>
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          try {
            const response = await getConfigTemplateList({});
            if (response.success && response.data) {
              // 简单的前端过滤和分页
              let filteredData = response.data;
              
              // 按名称过滤
              if ((params as any).name) {
                filteredData = filteredData.filter(item => 
                  item.name?.toLowerCase().includes(((params as any).name as string).toLowerCase())
                );
              }
              
              // 按配置类型过滤
              if ((params as any).configType) {
                filteredData = filteredData.filter(item => 
                  item.configType === (params as any).configType
                );
              }
              
              return {
                data: filteredData,
                success: true,
                total: filteredData.length
              };
            }
            return {
              data: [],
              success: false,
              total: 0
            };
          } catch (error) {
            return {
              data: [],
              success: false,
              total: 0
            };
          }
        }}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      {/* 编辑配置模版表单 */}
      <ModalForm
        title="编辑配置模版"
        width="600px"
        formRef={updateFormRef}
        modalProps={{
          destroyOnClose: true,
        }}
        open={updateModalVisible}
        onOpenChange={setUpdateModalVisible}
        onFinish={handleUpdate}
        initialValues={currentRow}
      >
        <ProFormText
          name="name"
          label="模版名称"
          rules={[{ required: true, message: '请输入模版名称' }]}
          placeholder="请输入模版名称"
        />
        <ProFormTextArea
          name="applicableScenario"
          label="适用场景"
          placeholder="请输入适用场景（可选）"
          fieldProps={{
            rows: 3,
          }}
        />
        <ProFormSelect
          name="marketCondition"
          label="行情类型"
          placeholder="请选择行情类型（可选）"
          valueEnum={{
            '震荡': '震荡',
            '高开高走': '高开高走',
            '高开低走': '高开低走',
            '低开高走': '低开高走',
            '低开低走': '低开低走',
          }}
        />
        <ProFormText
          name="volatilityRange"
          label="波动范围"
          placeholder="请输入波动范围（可选）"
        />
        <ProFormSelect
          name="strategyId"
          label="策略"
          request={async () => {
            try {
              const res = await listStrategyJob({
                current: 1,
                pageSize: 100,
                status: '1',
              });
              if (res && res.data) {
                return res.data.map((item: any) => ({
                  label: item.name,
                  value: item.id,
                }));
              }
              return [];
            } catch (error) {
              return [];
            }
          }}
          placeholder="请选择策略（可选）"
        />
        <ProFormText
          name="sourceStockCode"
          label="来源股票代码"
          placeholder="请输入来源股票代码（可选）"
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1 }}>
            <ProFormDigit
              name="minMarketCap"
              label="最小市值（亿美元）"
              placeholder="请输入最小市值"
              min={0}
              fieldProps={{
                precision: 2,
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <ProFormDigit
              name="maxMarketCap"
              label="最大市值（亿美元）"
              placeholder="请输入最大市值"
              min={0}
              fieldProps={{
                precision: 2,
              }}
            />
          </div>
        </div>
      </ModalForm>
    </>
  );
};

export default StrategyConfigTemplateManagement; 