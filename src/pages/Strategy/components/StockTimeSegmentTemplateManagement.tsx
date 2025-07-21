import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Popconfirm, Space, Tag, Tooltip, Row, Col } from 'antd';
import { EditOutlined, DeleteOutlined, PlayCircleOutlined, QuestionCircleOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { request } from '@umijs/max';
import { FormattedMessage } from '@umijs/max';
import TimeSegmentConfigForm from './TimeSegmentConfigForm';

const { Option } = Select;

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

interface StockTimeSegmentTemplateManagementProps {
  strategyId?: number;
  strategyName?: string;
}

const StockTimeSegmentTemplateManagement: React.FC<StockTimeSegmentTemplateManagementProps> = ({
  strategyId,
  strategyName,
}) => {
  const [templates, setTemplates] = useState<TimeSegmentTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [applyModalVisible, setApplyModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TimeSegmentTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TimeSegmentTemplate | null>(null);
  const [strategyStocks, setStrategyStocks] = useState<any[]>([]);
  const [selectedStrategyStockIds, setSelectedStrategyStockIds] = useState<number[]>([]);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [templateLevels, setTemplateLevels] = useState<any[]>([]);
  const [form] = Form.useForm();
  const [applyForm] = Form.useForm();
  const [searchForm] = Form.useForm();
  const [applySearchForm] = Form.useForm();

  // 搜索条件状态
  const [searchParams, setSearchParams] = useState({
    stockCode: '',
    templateLevel: '',
    strategyId: strategyId || undefined,
  });

  // 应用对话框搜索条件状态
  const [applySearchParams, setApplySearchParams] = useState({
    stockCode: '',
    templateLevel: '',
  });

  // 过滤后的策略股票列表
  const [filteredStrategyStocks, setFilteredStrategyStocks] = useState<any[]>([]);

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

  // 校验时间段格式
  const validateTimeSegment = (timeSegment: string) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeSegment);
  };

  // 将时间字符串转换为分钟数（用于排序）
  const timeToMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
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
        configType: 'STOCK',
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

  // 加载策略股票配置
  const loadStrategyStocks = async () => {
    try {
      const params: any = {
        current: 1,
        pageSize: 1000,
      };
      
      // 如果有strategyId，则添加到参数中
      if (strategyId) {
        params.strategyId = strategyId;
      }

      const response = await request('/api/strategy/stock/page', {
        method: 'GET',
        params: params,
      });
      if (response.success) {
        setStrategyStocks(response.data.records || response.data || []);
      }
    } catch (error) {
      message.error('加载策略股票配置失败');
    }
  };

  useEffect(() => {
    loadTemplates();
    loadStrategies();
    loadStrategyStocks();
    loadTemplateLevels();
  }, []);

  // 过滤策略股票列表
  const filterStrategyStocks = (stocks: any[], searchParams: any) => {
    return stocks.filter(stock => {
      const matchStockCode = !searchParams.stockCode || 
        stock.stockCode.toLowerCase().includes(searchParams.stockCode.toLowerCase());
      
      const matchTemplateLevel = !searchParams.templateLevel || 
        (stock.timeSegmentTemplateId && 
         templates.find(t => t.id === stock.timeSegmentTemplateId)?.templateLevel === searchParams.templateLevel);
      
      return matchStockCode && matchTemplateLevel;
    });
  };

  // 更新过滤后的策略股票列表
  useEffect(() => {
    const filtered = filterStrategyStocks(strategyStocks, applySearchParams);
    setFilteredStrategyStocks(filtered);
  }, [strategyStocks, applySearchParams, templates]);

  // 处理搜索
  const handleSearch = () => {
    const values = searchForm.getFieldsValue();
    const searchConditions = {
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
      stockCode: '',
      templateLevel: '',
      strategyId: strategyId || undefined,
    });
    loadTemplates();
  };

  // 处理应用对话框搜索
  const handleApplySearch = () => {
    const values = applySearchForm.getFieldsValue();
    setApplySearchParams({
      stockCode: values.stockCode || '',
      templateLevel: values.templateLevel || '',
    });
  };

  // 重置应用对话框搜索
  const handleApplyReset = () => {
    applySearchForm.resetFields();
    setApplySearchParams({
      stockCode: '',
      templateLevel: '',
    });
  };

  // 处理编辑
  const handleSave = async (values: any) => {
    try {
      // 处理时段配置
      const { timeSegmentMaConfigInput, ...otherValues } = values;
      
      let timeSegmentMaConfig = '';
      if (timeSegmentMaConfigInput && timeSegmentMaConfigInput.length > 0) {
        // 验证时段格式和重复性
        const timeSegments = timeSegmentMaConfigInput.map((item: any) => item.timeSegment);
        const uniqueTimeSegments = [...new Set(timeSegments)];
        
        if (uniqueTimeSegments.length !== timeSegments.length) {
          message.error('时段配置中存在重复的时间段');
          return;
        }
        
        // 验证时段格式
        for (const item of timeSegmentMaConfigInput) {
          if (!validateTimeSegment(item.timeSegment)) {
            message.error(`时段 ${item.timeSegment} 格式不正确，请使用 HH:mm 格式`);
            return;
          }
        }
        
        // 按时间排序并转换百分比为小数
        const sortedConfig = timeSegmentMaConfigInput
          .sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment))
          .map((item: any) => ({
            timeSegment: item.timeSegment,
            maBelowPercent: item.maBelowPercent / 100, // 百分比转小数
            maAbovePercent: item.maAbovePercent / 100, // 百分比转小数
            profitPercent: item.profitPercent / 100, // 百分比转小数
          }));
        
        timeSegmentMaConfig = JSON.stringify(sortedConfig);
      }

      const templateData = {
        ...otherValues,
        timeSegmentMaConfig,
        configType: 'STOCK',
        strategyId: otherValues.strategyId || strategyId,
        strategyName: otherValues.strategyName || strategyName,
      };

      if (editingTemplate) {
        await request('/api/timeSegmentTemplate/update', {
          method: 'PUT',
          data: { ...templateData, id: editingTemplate.id },
        });
        message.success('更新档位配置成功');
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
      await request('/api/timeSegmentTemplate/applyToStrategyStock', {
        method: 'POST',
        data: {
          templateId: selectedTemplate?.id,
          strategyStockIds: selectedStrategyStockIds,
        },
      });
      message.success('应用档位配置成功');
      setApplyModalVisible(false);
      setSelectedTemplate(null);
      setSelectedStrategyStockIds([]);
      applyForm.resetFields();
    } catch (error) {
      message.error('应用档位配置失败');
    }
  };

  // 打开编辑对话框
  const handleEdit = (template: TimeSegmentTemplate) => {
    setEditingTemplate(template);
    
    // 解析时段配置并转换为表单格式
    const timeSegmentMaConfig = parseTimeSegmentMaConfig(template.timeSegmentMaConfig);
    const formattedConfig = timeSegmentMaConfig.map((config: any) => ({
      timeSegment: config.timeSegment,
      maBelowPercent: config.maBelowPercent * 100, // 转换为百分比显示
      maAbovePercent: config.maAbovePercent * 100,
      profitPercent: config.profitPercent * 100,
    }));
    
    form.setFieldsValue({
      ...template,
      timeSegmentMaConfigInput: formattedConfig,
    });
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
      hidden: true,
    },
    {
      title: <FormattedMessage id="template.stock" defaultMessage="股票代码" />,
      dataIndex: 'stockCode',
      key: 'stockCode',
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
            <FormattedMessage id="common.apply" defaultMessage="应用到其他股票" />
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

  const strategyStockColumns = [
    {
      title: <FormattedMessage id="stock.code" defaultMessage="股票代码" />,
      dataIndex: 'stockCode',
      key: 'stockCode',
    },
    {
      title: <FormattedMessage id="strategy.name" defaultMessage="策略名称" />,
      dataIndex: 'strategyName',
      key: 'strategyName',
    },
    {
      title: <FormattedMessage id="current.level" defaultMessage="当前档位" />,
      dataIndex: 'timeSegmentTemplateId',
      key: 'timeSegmentTemplateId',
      render: (templateId: number, record: any) => {
        if (!templateId) {
          return <Tag color="default">未设置</Tag>;
        }
        
        // 根据templateId查找对应的档位等级
        const template = templates.find(t => t.id === templateId);
        if (template && template.templateLevel) {
          return <Tag color="purple">{template.templateLevel}档</Tag>;
        }
        
        return <Tag color="orange">档位ID: {templateId}</Tag>;
      },
    },
    {
      title: <FormattedMessage id="current.config" defaultMessage="当前配置" />,
      dataIndex: 'timeSegmentMaConfig',
      key: 'timeSegmentMaConfig',
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
      title: <FormattedMessage id="stock.status" defaultMessage="状态" />,
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? '启用' : '禁用'}
        </Tag>
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
          <Col span={6}>
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
          <Col span={6}>
            <Form.Item name="stockCode" label="股票代码">
              <Input placeholder="请输入股票代码" allowClear />
            </Form.Item>
          </Col>
          <Col span={6}>
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
          <Col span={6}>
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

      {/* 编辑对话框 */}
      <Modal
        title={<FormattedMessage id="template.edit" defaultMessage="编辑档位配置" />}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingTemplate(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'flex-end',
            gap: 12, 
            marginBottom: 16,
            padding: 16,
            backgroundColor: '#f5f5f5',
            borderRadius: 6,
            border: '1px solid #d9d9d9'
          }}>
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
          </div>

          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="strategyId"
                label="策略"
                rules={[{ required: true, message: '请选择策略' }]}
              >
                <Select placeholder="请选择策略" disabled>
                  {strategies.map(strategy => (
                    <Option key={strategy.id} value={strategy.id}>
                      {strategy.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="stockCode"
                label={<FormattedMessage id="stock.code" defaultMessage="股票代码" />}
                rules={[{ required: true, message: '请输入股票代码' }]}
              >
                <Input placeholder="请输入股票代码" disabled />
              </Form.Item>
            </Col>
            <Col span={10}>
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
            </Col>
            <Col span={10}>
              <Form.Item
                name="templateName"
                label={<FormattedMessage id="template.name" defaultMessage="档位名称" />}
                rules={[{ required: true, message: '请输入档位名称' }]}
              >
                <Input placeholder="请输入档位名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={20}>
              <Form.Item
                name="useScenario"
                label={<FormattedMessage id="template.scenario" defaultMessage="使用场景" />}
                rules={[{ required: false, message: '请输入使用场景' }]}
              >
                <Input placeholder="请输入使用场景" />
              </Form.Item>
            </Col>
          </Row>

          <TimeSegmentConfigForm
            fieldName="timeSegmentMaConfigInput"
            form={form}
          />
        </Form>
      </Modal>

      {/* 应用档位配置对话框 */}
      <Modal
        title={<FormattedMessage id="template.apply" defaultMessage="应用档位配置" />}
        open={applyModalVisible}
        onCancel={() => {
          setApplyModalVisible(false);
          setSelectedTemplate(null);
          setSelectedStrategyStockIds([]);
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12, 
            marginBottom: 16,
            padding: 16,
            backgroundColor: '#f5f5f5',
            borderRadius: 6,
            border: '1px solid #d9d9d9'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              color: '#fa8c16',
              fontSize: '14px'
            }}>
              <QuestionCircleOutlined style={{ marginRight: 4 }} />
              应用档位配置后，将会覆盖所选股票的原有档位配置
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Button onClick={() => {
                setApplyModalVisible(false);
                setSelectedTemplate(null);
                setSelectedStrategyStockIds([]);
                applyForm.resetFields();
              }}>
                <FormattedMessage id="common.cancel" defaultMessage="取消" />
              </Button>
              <Button type="primary" htmlType="submit" disabled={selectedStrategyStockIds.length === 0}>
                <FormattedMessage id="common.apply" defaultMessage="应用到其他股票" />
              </Button>
            </div>
          </div>

          {/* 应用对话框搜索表单 */}
          <Form
            form={applySearchForm}
            layout="inline"
            style={{ marginBottom: 16, padding: 16, background: '#f5f5f5', borderRadius: 4 }}
          >
            <Row gutter={16} style={{ width: '100%' }}>
              <Col span={8}>
                <Form.Item name="stockCode" label="股票代码">
                  <Input placeholder="请输入股票代码" allowClear />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="templateLevel" label="当前档位">
                  <Select placeholder="请选择档位等级" allowClear>
                    {templateLevels.map(level => (
                      <Option key={level.value} value={level.value}>
                        {level.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item>
                  <Space>
                    <Button type="primary" onClick={handleApplySearch} icon={<SearchOutlined />}>
                      搜索
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={handleApplyReset}>
                      重置
                    </Button>
                  </Space>
                </Form.Item>
              </Col>
            </Row>
          </Form>

          <Form.Item
            label={<FormattedMessage id="template.selectTargets" defaultMessage="选择应用目标" />}
            required
          >
            <Table
              columns={strategyStockColumns}
              dataSource={filteredStrategyStocks}
              rowKey="id"
              size="small"
              pagination={false}
              rowSelection={{
                selectedRowKeys: selectedStrategyStockIds,
                onChange: (selectedRowKeys: React.Key[]) => {
                  setSelectedStrategyStockIds(selectedRowKeys.map(key => Number(key)));
                },
              }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StockTimeSegmentTemplateManagement; 