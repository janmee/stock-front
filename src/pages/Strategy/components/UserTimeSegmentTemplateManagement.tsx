import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tag, Tooltip, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, QuestionCircleOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import { FormattedMessage } from '@umijs/max';

const { Option } = Select;
const { TextArea } = Input;

interface TimeSegmentTemplate {
  id: number;
  templateName: string;
  templateLevel: string;
  useScenario: string;
  strategyId: number;
  strategyName: string;
  stockCode: string;
  account: string;
  accountName: string;
  timeSegmentMaConfig: string;
  configType: string;
  createTime: string;
  updateTime: string;
}

interface UserTimeSegmentTemplateManagementProps {
  strategyId?: number;
  strategyName?: string;
}

const UserTimeSegmentTemplateManagement: React.FC<UserTimeSegmentTemplateManagementProps> = ({
  strategyId,
  strategyName,
}) => {
  const [templates, setTemplates] = useState<TimeSegmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TimeSegmentTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TimeSegmentTemplate | null>(null);
  const [userStocks, setUserStocks] = useState<any[]>([]);
  const [selectedUserStockIds, setSelectedUserStockIds] = useState<number[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [templateLevels, setTemplateLevels] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [applyForm] = Form.useForm();
  const [searchForm] = Form.useForm();

  // 搜索条件状态
  const [searchParams, setSearchParams] = useState({
    account: '',
    stockCode: '',
    templateLevel: '',
    strategyId: strategyId || undefined,
  });

  // 默认时段配置
  const defaultTimeSegmentMaConfig = [
    { timeSegment: '09:30', maBelowPercent: 0.002, maAbovePercent: 0.001, profitPercent: 0.01 },
    { timeSegment: '12:00', maBelowPercent: 0.005, maAbovePercent: -0.002, profitPercent: 0.01 },
    { timeSegment: '14:00', maBelowPercent: 0.008, maAbovePercent: -0.005, profitPercent: 0.01 },
  ];

  // 解析时段分时平均线配置
  const parseTimeSegmentMaConfig = (configString: string | undefined) => {
    if (!configString) {
      return defaultTimeSegmentMaConfig;
    }
    try {
      const config = JSON.parse(configString);
      if (Array.isArray(config) && config.length > 0) {
        return config.map((item: any) => ({
          timeSegment: item.timeSegment || '09:30',
          maBelowPercent: item.maBelowPercent || 0.002,
          maAbovePercent: item.maAbovePercent || 0.001,
          profitPercent: item.profitPercent || 0.01,
        }));
      }
      return defaultTimeSegmentMaConfig;
    } catch (error) {
      console.warn('解析时段分时平均线配置失败:', error);
      return defaultTimeSegmentMaConfig;
    }
  };

  // 获取档位等级选项
  const loadTemplateLevels = async () => {
    try {
      const response = await request('/api/timeSegmentTemplate/templateLevels');
      if (response.success) {
        setTemplateLevels(response.data);
      }
    } catch (error) {
      console.error('获取档位等级失败:', error);
    }
  };

  // 加载档位模板列表
  const loadTemplates = async (params?: any) => {
    setLoading(true);
    try {
      const searchConditions = {
        configType: 'USER',
        current: 1,
        pageSize: 1000,
        ...params,
      };

      // 如果有strategyId参数，则添加到搜索条件中
      if (params?.strategyId || strategyId) {
        searchConditions.strategyId = params?.strategyId || strategyId;
      }

      const response = await request('/api/timeSegmentTemplate/list', {
        method: 'GET',
        params: searchConditions,
      });
      if (response.success) {
        setTemplates(response.data.records || []);
      }
    } catch (error) {
      message.error('加载档位配置失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载策略选项
  const loadStrategies = async () => {
    try {
      const response = await request('/api/strategy/job/page', {
        method: 'GET',
        params: { current: 1, pageSize: 1000 },
      });
      if (response.success) {
        setStrategies(response.data.records || response.data || []);
      }
    } catch (error) {
      message.error('加载策略列表失败');
    }
  };

  // 加载用户股票配置
  const loadUserStocks = async () => {
    try {
      const params: any = {
        current: 1,
        pageSize: 1000,
      };
      
      // 如果有strategyId，则添加到参数中
      if (strategyId) {
        params.strategyId = strategyId;
      }

      const response = await request('/api/strategy/user-stock/page', {
        method: 'GET',
        params: params,
      });
      if (response.success) {
        setUserStocks(response.data.records || response.data || []);
      }
    } catch (error) {
      message.error('加载用户股票配置失败');
    }
  };

  // 加载账户列表
  const loadAccounts = async () => {
    try {
      const response = await request('/api/accountInfo/list', {
        method: 'GET',
        params: { current: 1, pageSize: 1000 },
      });
      if (response.success) {
        setAccounts(response.data || []);
      }
    } catch (error) {
      console.error('获取账户列表失败:', error);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadStrategies();
    loadUserStocks();
    loadTemplateLevels();
    loadAccounts();
  }, []);

  // 处理搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    const searchConditions = {
      account: values.account || '',
      stockCode: values.stockCode || '',
      templateLevel: values.templateLevel || '',
      strategyId: values.strategyId || strategyId,
    };
    setSearchParams(searchConditions);
    loadTemplates(searchConditions);
  };

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    setSearchParams({
      account: '',
      stockCode: '',
      templateLevel: '',
      strategyId: strategyId || undefined,
    });
    loadTemplates();
  };

  // 处理新增/编辑
  const handleSave = async (values: any) => {
    try {
      const templateData = {
        ...values,
        configType: 'USER',
        strategyId: values.strategyId || strategyId,
        strategyName: values.strategyName || strategyName,
      };

      if (editingTemplate) {
        await request('/api/timeSegmentTemplate/update', {
          method: 'PUT',
          data: { ...templateData, id: editingTemplate.id },
        });
        message.success('更新档位配置成功');
      } else {
        await request('/api/timeSegmentTemplate/create', {
          method: 'POST',
          data: templateData,
        });
        message.success('创建档位配置成功');
      }

      setModalVisible(false);
      setEditingTemplate(null);
      form.resetFields();
      loadTemplates();
    } catch (error) {
      message.error('保存档位配置失败');
    }
  };

  // 处理删除
  const handleDelete = async (id: number) => {
    try {
      await request(`/api/timeSegmentTemplate/delete/${id}`, {
        method: 'DELETE',
      });
      message.success('删除档位配置成功');
      loadTemplates();
    } catch (error) {
      message.error('删除档位配置失败');
    }
  };

  // 处理应用档位配置
  const handleApply = async (values: any) => {
    try {
      await request('/api/timeSegmentTemplate/applyToUserStock', {
        method: 'POST',
        data: {
          templateId: selectedTemplate?.id,
          userStockIds: selectedUserStockIds,
        },
      });
      message.success('应用档位配置成功');
      setApplyModalVisible(false);
      setSelectedTemplate(null);
      setSelectedUserStockIds([]);
      applyForm.resetFields();
    } catch (error) {
      message.error('应用档位配置失败');
    }
  };

  // 打开新增对话框
  const handleAdd = () => {
    setEditingTemplate(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑对话框
  const handleEdit = (template: TimeSegmentTemplate) => {
    setEditingTemplate(template);
    form.setFieldsValue(template);
    setModalVisible(true);
  };

  // 打开应用对话框
  const handleOpenApply = (template: TimeSegmentTemplate) => {
    setSelectedTemplate(template);
    setApplyModalVisible(true);
  };

  const columns = [
    {
      title: <FormattedMessage id="template.name" defaultMessage="档位名称" />,
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: <FormattedMessage id="template.level" defaultMessage="档位等级" />,
      dataIndex: 'templateLevel',
      key: 'templateLevel',
      render: (text: string) => (
        <Tag color="blue">{text}</Tag>
      ),
    },
    {
      title: <FormattedMessage id="template.scenario" defaultMessage="使用场景" />,
      dataIndex: 'useScenario',
      key: 'useScenario',
    },
    {
      title: <FormattedMessage id="template.strategy" defaultMessage="策略" />,
      dataIndex: 'strategyName',
      key: 'strategyName',
    },
    {
      title: <FormattedMessage id="template.stock" defaultMessage="股票代码" />,
      dataIndex: 'stockCode',
      key: 'stockCode',
    },
    {
      title: <FormattedMessage id="template.account" defaultMessage="账户" />,
      dataIndex: 'account',
      key: 'account',
      render: (text: string, record: TimeSegmentTemplate) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.accountName}</div>
        </div>
      ),
    },
    {
      title: (
        <>
          <FormattedMessage id="template.config" defaultMessage="档位配置" />
          <Tooltip title="不同时段的分时平均线买入配置和盈利点">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'timeSegmentMaConfig',
      key: 'timeSegmentMaConfig',
      width: 280,
      render: (text: string) => {
        if (!text) {
          return <Tag color="default">无配置</Tag>;
        }
        
        try {
          const config = parseTimeSegmentMaConfig(text);
          if (!Array.isArray(config) || config.length === 0) {
            return <Tag color="default">无配置</Tag>;
          }
          
          return (
            <div>
              {config.map((item: any, index: number) => (
                <Tag key={index} color="blue" style={{ marginBottom: 2 }}>
                  {item.timeSegment}: 分时下方{(item.maBelowPercent * 100).toFixed(2)}%/分时上方{(item.maAbovePercent * 100).toFixed(2)}%/盈利点{((item.profitPercent || 0) * 100).toFixed(2)}%
                </Tag>
              ))}
            </div>
          );
        } catch (error) {
          return <Tag color="red">配置错误</Tag>;
        }
      },
    },
    {
      title: <FormattedMessage id="common.createTime" defaultMessage="创建时间" />,
      dataIndex: 'createTime',
      key: 'createTime',
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: <FormattedMessage id="common.action" defaultMessage="操作" />,
      key: 'action',
      render: (_: any, record: TimeSegmentTemplate) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            <FormattedMessage id="common.edit" defaultMessage="编辑" />
          </Button>
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleOpenApply(record)}
          >
            <FormattedMessage id="common.apply" defaultMessage="应用" />
          </Button>
          <Popconfirm
            title={<FormattedMessage id="common.confirmDelete" defaultMessage="确认删除?" />}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              <FormattedMessage id="common.delete" defaultMessage="删除" />
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const userStockColumns = [
    {
      title: <FormattedMessage id="stock.code" defaultMessage="股票代码" />,
      dataIndex: 'stockCode',
      key: 'stockCode',
    },
    {
      title: <FormattedMessage id="account.info" defaultMessage="账户信息" />,
      dataIndex: 'account',
      key: 'account',
      render: (text: string, record: any) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.accountName}</div>
        </div>
      ),
    },
    {
      title: <FormattedMessage id="current.config" defaultMessage="当前配置" />,
      dataIndex: 'timeSegmentMaConfig',
      key: 'timeSegmentMaConfig',
      render: (text: string) => (
        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {text || '-'}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* 搜索表单 */}
      <Form
        form={searchForm}
        layout="inline"
        style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}
      >
        <Row gutter={16} style={{ width: '100%' }}>
          <Col span={5}>
            <Form.Item name="strategyId" label="策略">
              <Select placeholder="请选择策略" allowClear>
                {strategies.map(strategy => (
                  <Option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="account" label="账户">
              <Select placeholder="请选择账户" allowClear>
                {accounts.map(account => (
                  <Option key={account.account} value={account.account}>
                    {account.account} - {account.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="stockCode" label="股票代码">
              <Input placeholder="请输入股票代码" allowClear />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="templateLevel" label="档位等级">
              <Select placeholder="请选择档位等级" allowClear>
                {templateLevels.map(level => (
                  <Option key={level.value} value={level.value}>
                    {level.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item>
              <Space>
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                  搜索
                </Button>
                <Button icon={<ReloadOutlined />} onClick={handleReset}>
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          <FormattedMessage id="template.add" defaultMessage="新增档位配置" />
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={templates}
        loading={loading}
        rowKey="id"
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `总共 ${total} 条`,
        }}
      />

      {/* 新增/编辑对话框 */}
      <Modal
        title={editingTemplate ? <FormattedMessage id="template.edit" defaultMessage="编辑档位配置" /> : <FormattedMessage id="template.add" defaultMessage="新增档位配置" />}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTemplate(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="strategyId"
            label="策略"
            rules={[{ required: true, message: '请选择策略' }]}
          >
            <Select placeholder="请选择策略">
              {strategies.map(strategy => (
                <Option key={strategy.id} value={strategy.id}>
                  {strategy.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="templateName"
            label={<FormattedMessage id="template.name" defaultMessage="档位名称" />}
            rules={[{ required: true, message: '请输入档位名称' }]}
          >
            <Input placeholder="请输入档位名称" />
          </Form.Item>

          <Form.Item
            name="templateLevel"
            label={<FormattedMessage id="template.level" defaultMessage="档位等级" />}
            rules={[{ required: true, message: '请选择档位等级' }]}
          >
            <Select placeholder="请选择档位等级">
              {templateLevels.map(level => (
                <Option key={level.value} value={level.value}>
                  {level.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="useScenario"
            label={<FormattedMessage id="template.scenario" defaultMessage="使用场景" />}
            rules={[{ required: true, message: '请输入使用场景' }]}
          >
            <Input placeholder="请输入使用场景" />
          </Form.Item>

          <Form.Item
            name="stockCode"
            label={<FormattedMessage id="stock.code" defaultMessage="股票代码" />}
            rules={[{ required: true, message: '请输入股票代码' }]}
          >
            <Input placeholder="请输入股票代码" />
          </Form.Item>

          <Form.Item
            name="account"
            label={<FormattedMessage id="account.name" defaultMessage="账户" />}
            rules={[{ required: true, message: '请输入账户' }]}
          >
            <Input placeholder="请输入账户" />
          </Form.Item>

          <Form.Item
            name="accountName"
            label={<FormattedMessage id="account.alias" defaultMessage="账户别名" />}
          >
            <Input placeholder="请输入账户别名" />
          </Form.Item>

          <Form.Item
            name="timeSegmentMaConfig"
            label={<FormattedMessage id="template.config" defaultMessage="时段配置" />}
            rules={[{ required: true, message: '请输入时段配置' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入时段配置JSON"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                setEditingTemplate(null);
                form.resetFields();
              }}>
                <FormattedMessage id="common.cancel" defaultMessage="取消" />
              </Button>
              <Button type="primary" htmlType="submit">
                <FormattedMessage id="common.save" defaultMessage="保存" />
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 应用档位配置对话框 */}
      <Modal
        title={<FormattedMessage id="template.apply" defaultMessage="应用档位配置" />}
        open={applyModalVisible}
        onCancel={() => {
          setApplyModalVisible(false);
          setSelectedTemplate(null);
          setSelectedUserStockIds([]);
          applyForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue">
            {selectedTemplate?.templateName} - {selectedTemplate?.useScenario}
          </Tag>
        </div>

        <Form form={applyForm} layout="vertical" onFinish={handleApply}>
          <Form.Item
            label={<FormattedMessage id="template.selectTargets" defaultMessage="选择应用目标" />}
            required
          >
            <Table
              columns={userStockColumns}
              dataSource={userStocks}
              rowKey="id"
              size="small"
              pagination={false}
              rowSelection={{
                selectedRowKeys: selectedUserStockIds,
                onChange: (selectedRowKeys: React.Key[]) => {
                  setSelectedUserStockIds(selectedRowKeys.map(key => Number(key)));
                },
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setApplyModalVisible(false);
                setSelectedTemplate(null);
                setSelectedUserStockIds([]);
                applyForm.resetFields();
              }}>
                <FormattedMessage id="common.cancel" defaultMessage="取消" />
              </Button>
              <Button type="primary" htmlType="submit" disabled={selectedUserStockIds.length === 0}>
                <FormattedMessage id="common.apply" defaultMessage="应用" />
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserTimeSegmentTemplateManagement; 