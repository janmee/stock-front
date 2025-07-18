import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Space, 
  Button, 
  message, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  InputNumber, 
  Switch, 
  Select, 
  Divider,
  Row,
  Col,
  Statistic,
  Tooltip
} from 'antd';
import { 
  ReloadOutlined, 
  SettingOutlined, 
  PlayCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import { request } from '@umijs/max';
import { ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormSwitch } from '@ant-design/pro-components';
import { createStrategyStock, listStrategyJob, batchCreateStrategyUserStock, listAccountInfo } from '@/services/ant-design-pro/api';
import moment from 'moment';
import styles from './index.less';
import StrategyConfigModal from '@/components/StrategyConfigModal';

const { Option } = Select;

interface StockMinuteAlert {
  id: number;
  stockCode: string;
  stockName: string;
  alertTime: string;
  triggerPrice: number;
  triggerChangePercent: number;
  triggerVolume?: number;
  currentChangePercent?: number;
  minuteChangePercents: string;
  triggerCondition: string;
  createTime: string;
  updateTime: string;
  marketCap?: number;
  hasStrategyConfig?: boolean; // 是否已配置策略标的
  strategyEnabled?: boolean; // 策略是否已启动
}

interface MinuteCondition {
  minutes: number;
  changePercent: number;
}

interface MarketCapRange {
  minMarketCap: number;
  maxMarketCap: number;
  enabled: boolean;
  changePercentThreshold: number; // 单个涨跌幅阈值
  minAmount: number; // 最少成交金额，单位万美元
}

interface MarketCapFilter {
  enabled: boolean;
  ranges: MarketCapRange[];
}

interface MinuteAlertConfig {
  enabled: boolean;
  conditions: MinuteCondition[];
  marketCapFilter: MarketCapFilter;
}

interface AccountInfo {
  id: number;
  account: string;
  name: string;
  enable: boolean;
}

const StockAlert: React.FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [configLoading, setConfigLoading] = useState(false);
  const [data, setData] = useState<StockMinuteAlert[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [configVisible, setConfigVisible] = useState(false);
  const [config, setConfig] = useState<MinuteAlertConfig>({
    enabled: true,
    conditions: [],
    marketCapFilter: {
      enabled: false,
      ranges: [
        { minMarketCap: 0, maxMarketCap: 200, enabled: false, changePercentThreshold: 3.0, minAmount: 100 },
        { minMarketCap: 200, maxMarketCap: 1000, enabled: false, changePercentThreshold: 2.5, minAmount: 200 },
        { minMarketCap: 1000, maxMarketCap: 5000, enabled: false, changePercentThreshold: 2.0, minAmount: 500 },
      ]
    }
  });
  const [form] = Form.useForm();
  
  // 搜索条件状态
  const [searchParams, setSearchParams] = useState({
    stockCode: '',
    minMarketCap: null,
    mergeSameStock: true, // 默认合并相同股票数据
    showFirstTriggerTime: true, // 默认显示首次触发时间
  });

  // 生成策略配置相关状态
  const [strategyConfigVisible, setStrategyConfigVisible] = useState(false);
  const [currentStockAlert, setCurrentStockAlert] = useState<StockMinuteAlert | null>(null);

  // 获取异动数据
  const fetchData = async (current = 1, size = 20, search = searchParams, sorter?: any) => {
    setLoading(true);
    try {
      const requestData: any = {
        current,
        pageSize: size,
        stockCode: search.stockCode || undefined,
        minMarketCap: search.minMarketCap || undefined,
        mergeSameStock: search.mergeSameStock,
        showFirstTriggerTime: search.showFirstTriggerTime, // 添加showFirstTriggerTime参数
      };

      // 添加排序参数
      if (sorter && sorter.field && sorter.order) {
        requestData.sortKey = sorter.field;
        requestData.sortOrder = sorter.order;
      }

      const response = await request('/api/stock-minute-alert/page', {
        method: 'POST',
        data: requestData,
      });

      if (response.success) {
        setData(response.data.records || []);
        setPagination({
          current: response.data.current,
          pageSize: response.data.size,
          total: response.data.total,
        });
      } else {
        message.error(response.errorMessage || '获取数据失败');
      }
    } catch (error) {
      message.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取配置
  const fetchConfig = async () => {
    setConfigLoading(true);
    try {
      const response = await request('/api/stock-minute-alert/config', {
        method: 'GET',
      });

      if (response.success) {
        // 确保配置有正确的默认值
        const configData = response.data || {};
        const defaultConfig: MinuteAlertConfig = {
          enabled: true,
          conditions: [],
          marketCapFilter: {
            enabled: false,
            ranges: [
              { minMarketCap: 0, maxMarketCap: 200, enabled: false, changePercentThreshold: 3.0, minAmount: 100 },
              { minMarketCap: 200, maxMarketCap: 1000, enabled: false, changePercentThreshold: 2.5, minAmount: 200 },
              { minMarketCap: 1000, maxMarketCap: 5000, enabled: false, changePercentThreshold: 2.0, minAmount: 500 },
            ]
          }
        };
        
        // 合并服务器返回的配置和默认配置
        const mergedConfig = {
          ...defaultConfig,
          ...configData,
          marketCapFilter: {
            ...defaultConfig.marketCapFilter,
            ...configData.marketCapFilter,
            ranges: configData.marketCapFilter?.ranges || defaultConfig.marketCapFilter.ranges,
          }
        };
        
        setConfig(mergedConfig);
        form.setFieldsValue(mergedConfig);
      } else {
        message.error(response.errorMessage || '获取配置失败');
      }
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  // 保存配置
  const saveConfig = async (values: MinuteAlertConfig) => {
    setConfigLoading(true);
    try {
      console.log('前端发送的配置数据:', JSON.stringify(values, null, 2));
      
      const response = await request('/api/stock-minute-alert/config', {
        method: 'POST',
        data: values,
      });

      if (response.success) {
        message.success('配置保存成功');
        setConfig(values);
        setConfigVisible(false);
      } else {
        message.error(response.errorMessage || '保存配置失败');
      }
    } catch (error) {
      console.error('保存配置失败:', error);
      message.error('保存配置失败');
    } finally {
      setConfigLoading(false);
    }
  };

  // 立即运行任务
  const runTask = async () => {
    setRunLoading(true);
    try {
      const response = await request('/api/stock-minute-alert/run-now', {
        method: 'POST',
      });

      if (response.success) {
        message.success(response.data || '任务已启动');
        // 延迟刷新数据
        setTimeout(() => {
          fetchData(pagination.current, pagination.pageSize, searchParams);
        }, 3000);
      } else {
        message.error(response.errorMessage || '启动任务失败');
      }
    } catch (error) {
      message.error('启动任务失败');
    } finally {
      setRunLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchConfig();
  }, []);

  // 处理搜索
  const handleSearch = (values: any) => {
    const newSearchParams = {
      stockCode: values.stockCode || '',
      minMarketCap: values.minMarketCap || null,
      mergeSameStock: values.mergeSameStock !== undefined ? values.mergeSameStock : true,
      showFirstTriggerTime: values.showFirstTriggerTime !== undefined ? values.showFirstTriggerTime : true,
    };
    setSearchParams(newSearchParams);
    fetchData(1, pagination.pageSize, newSearchParams);
  };

  // 重置搜索
  const handleReset = () => {
    const defaultParams = {
      stockCode: '',
      minMarketCap: null,
      mergeSameStock: true,
      showFirstTriggerTime: true,
    };
    setSearchParams(defaultParams);
    fetchData(1, pagination.pageSize, defaultParams);
  };

  // 处理表格变化（分页、排序等）
  const handleTableChange = (page: any, filters: any, sorter: any) => {
    const { current, pageSize } = page;
    fetchData(current, pageSize, searchParams, sorter);
  };

  // 处理生成策略配置
  const handleGenerateStrategy = (record: StockMinuteAlert) => {
    setCurrentStockAlert(record);
    setStrategyConfigVisible(true);
  };

  // 处理策略启动/停止控制
  const handleStrategyControl = async (stockCode: string, enabled: boolean) => {
    try {
      const response = await request(`/api/stock-minute-alert/strategy-control/${stockCode}/${enabled}`, {
        method: 'POST',
      });

      if (response.success) {
        message.success(response.data || `策略${enabled ? '启用' : '禁用'}成功`);
        // 刷新数据
        fetchData(pagination.current, pagination.pageSize, searchParams);
      } else {
        message.error(response.errorMessage || `策略${enabled ? '启用' : '禁用'}失败`);
      }
    } catch (error) {
      message.error(`策略${enabled ? '启用' : '禁用'}失败`);
    }
  };

  // 策略配置成功后的回调
  const handleStrategyConfigSuccess = () => {
    // 刷新数据以更新策略配置状态
    fetchData(pagination.current, pagination.pageSize, searchParams);
  };

  // 解析分钟涨跌幅
  const parseMinuteChangePercents = (minuteChangePercents: string) => {
    try {
      return JSON.parse(minuteChangePercents);
    } catch {
      return {};
    }
  };

  // 表格列定义
  const columns = [
    {
      title: <FormattedMessage id="pages.stockAlert.stockCode" defaultMessage="股票" />,
      dataIndex: 'stockCode',
      key: 'stockCode',
      width: 80,
      render: (text: string) => (
        <Tag 
          color="blue" 
          style={{ cursor: 'pointer' }}
          onClick={() => window.open(`https://www.futunn.com/stock/${text}-US`, '_blank')}
        >
          {text}
        </Tag>
      ),
    },
    {
      title: <FormattedMessage id="pages.stockAlert.marketCap" defaultMessage="市值" />,
      dataIndex: 'marketCap',
      key: 'marketCap',
      width: 80,
      render: (marketCap: number) => marketCap ? `${marketCap.toLocaleString()}亿` : '-',
      sorter: (a: StockMinuteAlert, b: StockMinuteAlert) => a.marketCap! - b.marketCap!,
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerChange" defaultMessage="触发时涨跌幅" />,
      dataIndex: 'triggerChangePercent',
      key: 'triggerChangePercent',
      width: 100,
      render: (percent: number) => {
        const color = percent >= 0 ? '#ff4d4f' : '#52c41a';
        return <span style={{ color }}>{percent?.toFixed(2)}%</span>;
      },
      sorter: (a: StockMinuteAlert, b: StockMinuteAlert) => a.triggerChangePercent - b.triggerChangePercent,
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerVolume" defaultMessage="触发时成交量" />,
      dataIndex: 'triggerVolume',
      key: 'triggerVolume',
      width: 90,
      render: (volume: number) => volume ? volume.toLocaleString() : '-',
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerAmount" defaultMessage="触发时总成交金额" />,
      key: 'triggerAmount',
      width: 90,
      render: (_: any, record: StockMinuteAlert) => {
        if (record.triggerPrice && record.triggerVolume) {
          const amount = record.triggerPrice * record.triggerVolume;
          // 格式化为中文单位，大于万时显示万，大于亿时显示亿
          if (amount >= 100000000) { // 大于等于1亿
            return `${(amount / 100000000).toFixed(0)}亿`;
          } else if (amount >= 10000) { // 大于等于1万
            return `${(amount / 10000).toFixed(0)}万`;
          } else {
            return `${amount.toLocaleString()}`;
          }
        }
        return '-';
      },
    },
    {
      title: <FormattedMessage id="pages.stockAlert.currentChange" defaultMessage="当前涨跌幅" />,
      dataIndex: 'currentChangePercent',
      key: 'currentChangePercent',
      width: 120,
      render: (percent: number) => {
        if (percent === null || percent === undefined) {
          return <span style={{ color: '#999' }}>获取中...</span>;
        }
        const color = percent >= 0 ? '#ff4d4f' : '#52c41a';
        return <span style={{ color }}>{percent?.toFixed(2)}%</span>;
      },
    },
    {
      title: <FormattedMessage id="pages.stockAlert.minuteChanges" defaultMessage="触发时N分钟涨跌幅" />,
      dataIndex: 'minuteChangePercents',
      key: 'minuteChangePercents',
      width: 150,
      render: (text: string) => {
        const changes = parseMinuteChangePercents(text);
        
        // 将对象转换为数组并按分钟数排序
        const sortedEntries = Object.entries(changes).sort((a, b) => {
          // 从键名中提取分钟数（如"1min" -> 1, "5min" -> 5）
          const minutesA = parseInt(a[0].replace('min', ''));
          const minutesB = parseInt(b[0].replace('min', ''));
          return minutesA - minutesB;
        });
        
        return (
          <Space wrap>
            {sortedEntries.map(([period, data]: [string, any]) => {
              // 兼容旧格式（纯数字）和新格式（对象）
              const changePercent = typeof data === 'object' ? data.changePercent : data;
              const volume = typeof data === 'object' ? data.volume : null;
              const color = changePercent >= 0 ? 'red' : 'green';
              
              return (
                <Tag key={period} color={color}>
                  {period}: {changePercent?.toFixed(2)}%
                  {volume !== null && volume !== undefined && (
                    <div style={{ fontSize: '10px', opacity: 0.8 }}>
                      Vol: {volume.toLocaleString()}
                    </div>
                  )}
                </Tag>
              );
            })}
          </Space>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerCondition" defaultMessage="触发条件" />,
      dataIndex: 'triggerCondition',
      key: 'triggerCondition',
      width: 200,
      render: (text: string) => {
        if (!text) return '-';
        
        // 将分号分隔的条件转换为数组，每个条件一行
        const conditions = text.split('; ').filter(condition => condition.trim());
        
        return (
          <div style={{ 
            fontSize: '12px',
            lineHeight: '1.5',
            maxWidth: '350px',
          }}>
            {conditions.map((condition, index) => (
              <div key={index} style={{ 
                marginBottom: index < conditions.length - 1 ? '4px' : '0',
                wordBreak: 'break-all',
                whiteSpace: 'normal',
              }}>
                • {condition.trim()}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      title: <FormattedMessage id="pages.stockAlert.triggerTime" defaultMessage="触发时间" />,
      dataIndex: 'alertTime',
      key: 'alertTime',
      width: 180,
      render: (time: string) => moment(time).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a: StockMinuteAlert, b: StockMinuteAlert) => moment(a.alertTime).valueOf() - moment(b.alertTime).valueOf(),
    },
    {
      title: <FormattedMessage id="pages.stockAlert.action" defaultMessage="操作" />,
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: StockMinuteAlert) => (
        <Space size="small">
          {!record.hasStrategyConfig ? (
            <Tooltip title={intl.formatMessage({ id: 'pages.stockAlert.generateStrategy' })}>
              <Button
                type="primary"
                size="small"
                icon={<PlusOutlined />}
                onClick={() => handleGenerateStrategy(record)}
              >
                <FormattedMessage id="pages.stockAlert.generateStrategy" defaultMessage="生成策略" />
              </Button>
            </Tooltip>
          ) : (
            <>
              {record.strategyEnabled ? (
                <Tooltip title="停止策略">
                  <Button
                    type="primary"
                    danger
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleStrategyControl(record.stockCode, false)}
                  >
                    停止
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title="启动策略">
                  <Button
                    type="primary"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => handleStrategyControl(record.stockCode, true)}
                  >
                    启动
                  </Button>
                </Tooltip>
              )}
              <Tooltip title="已配置策略">
                <Button
                  size="small"
                  disabled
                  icon={<PlusOutlined />}
                >
                  已配置
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <Card 
        title={
          <Space>
            <ExclamationCircleOutlined />
            <FormattedMessage id="menu.list.stock-alert" defaultMessage="股票异动" />
          </Space>
        }
        extra={
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={runLoading}
              onClick={runTask}
            >
              <FormattedMessage id="pages.stockAlert.runNow" defaultMessage="立即运行" />
            </Button>
            <Button
              icon={<SettingOutlined />}
              onClick={() => setConfigVisible(true)}
            >
              <FormattedMessage id="pages.stockAlert.config" defaultMessage="配置" />
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={() => fetchData(pagination.current, pagination.pageSize, searchParams)}
            >
              <FormattedMessage id="pages.stockAlert.refresh" defaultMessage="刷新" />
            </Button>
          </Space>
        }
      >
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Statistic
              title={<FormattedMessage id="pages.stockAlert.totalAlerts" defaultMessage="总异动数" />}
              value={pagination.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<FormattedMessage id="pages.stockAlert.todayAlerts" defaultMessage="今日异动" />}
              value={data.filter(item => 
                moment(item.alertTime).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')
              ).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<FormattedMessage id="pages.stockAlert.alertStatus" defaultMessage="告警启用状态" />}
              value={config.enabled ? '启用' : '禁用'}
              valueStyle={{ color: config.enabled ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title={<FormattedMessage id="pages.stockAlert.enabledThresholds" defaultMessage="启用的涨跌幅阈值" />}
              value={config.marketCapFilter.ranges
                ?.filter(r => r.enabled)
                ?.map(r => `${r.minMarketCap}-${r.maxMarketCap}亿 (${r.changePercentThreshold}%)`)
                ?.join('; ') || '无'}
              valueStyle={{ color: '#722ed1' }}
            />
          </Col>
        </Row>

        {/* 搜索表单 */}
        <Card style={{ marginBottom: 16 }}>
          <Form 
            layout="inline" 
            onFinish={handleSearch}
            initialValues={searchParams}
            style={{ marginBottom: 0 }}
          >
            <Form.Item 
              name="stockCode" 
              label={<FormattedMessage id="pages.stockAlert.search.stockCode" defaultMessage="股票代码" />}
            >
              <Input 
                placeholder={intl.formatMessage({
                  id: 'pages.stockAlert.search.stockCode.placeholder',
                  defaultMessage: '请输入股票代码'
                })}
                allowClear
                style={{ width: 200 }}
              />
            </Form.Item>
            
            <Form.Item 
              name="minMarketCap" 
              label={<FormattedMessage id="pages.stockAlert.search.minMarketCap" defaultMessage="市值大于" />}
            >
              <InputNumber 
                placeholder={intl.formatMessage({
                  id: 'pages.stockAlert.search.minMarketCap.placeholder',
                  defaultMessage: '请输入最小市值'
                })}
                min={0}
                style={{ width: 200 }}
                addonAfter="亿美元"
              />
            </Form.Item>
            
            <Form.Item 
              name="mergeSameStock" 
              label={<FormattedMessage id="pages.stockAlert.search.mergeSameStock" defaultMessage="合并相同股票" />}
              valuePropName="checked"
            >
              <Switch 
                checkedChildren={intl.formatMessage({
                  id: 'pages.stockAlert.search.mergeSameStock.on',
                  defaultMessage: '开启'
                })}
                unCheckedChildren={intl.formatMessage({
                  id: 'pages.stockAlert.search.mergeSameStock.off',
                  defaultMessage: '关闭'
                })}
              />
            </Form.Item>
            
            <Form.Item 
              name="showFirstTriggerTime" 
              label={<FormattedMessage id="pages.stockAlert.search.showFirstTriggerTime" defaultMessage="显示首次触发时间" />}
              valuePropName="checked"
            >
              <Switch 
                checkedChildren={intl.formatMessage({
                  id: 'pages.stockAlert.search.showFirstTriggerTime.on',
                  defaultMessage: '首次'
                })}
                unCheckedChildren={intl.formatMessage({
                  id: 'pages.stockAlert.search.showFirstTriggerTime.off',
                  defaultMessage: '最新'
                })}
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  <FormattedMessage id="pages.stockAlert.search.search" defaultMessage="搜索" />
                </Button>
                <Button onClick={handleReset}>
                  <FormattedMessage id="pages.stockAlert.search.reset" defaultMessage="重置" />
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
            onChange: (current, size) => {
              fetchData(current, size, searchParams);
            },
          }}
          scroll={{ x: 800 }}
          onChange={handleTableChange}
        />
      </Card>

      {/* 配置弹窗 */}
      <Modal
        title={intl.formatMessage({ id: 'pages.stockAlert.configModalTitle', defaultMessage: '纳斯达克股票异动分析配置' })}
        open={configVisible}
        onCancel={() => setConfigVisible(false)}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          onFinish={saveConfig}
          layout="vertical"
          initialValues={{
            enabled: config.enabled,
            conditions: config.conditions || [],
            marketCapFilter: {
              enabled: config.marketCapFilter?.enabled || false,
              ranges: config.marketCapFilter?.ranges || [
                { minMarketCap: 0, maxMarketCap: 200, enabled: false, changePercentThreshold: 3.0, minAmount: 100 },
                { minMarketCap: 200, maxMarketCap: 1000, enabled: false, changePercentThreshold: 2.5, minAmount: 200 },
                { minMarketCap: 1000, maxMarketCap: 5000, enabled: false, changePercentThreshold: 2.0, minAmount: 500 },
              ]
            }
          }}
        >
          <Form.Item
            name="enabled"
            label={<FormattedMessage id="pages.stockAlert.enableAlert" defaultMessage="启用告警功能" />}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Divider><FormattedMessage id="pages.stockAlert.minuteConditions" defaultMessage="分钟级别告警条件" /></Divider>
          <Form.List name="conditions">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} style={{ alignItems: 'center' }}>
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'minutes']}
                        label={<FormattedMessage id="pages.stockAlert.minutes" defaultMessage="分钟数" />}
                        rules={[{ required: true, message: '请输入分钟数' }]}
                      >
                        <InputNumber min={1} max={60} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'changePercent']}
                        label={<FormattedMessage id="pages.stockAlert.changeThreshold" defaultMessage="涨跌幅阈值 (%)" />}
                        rules={[{ required: true, message: '请输入涨跌幅阈值' }]}
                      >
                        <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Button 
                        type="link" 
                        danger 
                        onClick={() => remove(name)}
                        style={{ marginTop: 30 }}
                      >
                        <FormattedMessage id="pages.stockAlert.marketCapRange.delete" defaultMessage="删除" />
                      </Button>
                    </Col>
                  </Row>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    <FormattedMessage id="pages.stockAlert.addCondition" defaultMessage="添加条件" />
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider><FormattedMessage id="pages.stockAlert.marketCapFilter" defaultMessage="市值筛选配置" /></Divider>
          <Form.Item
            name={['marketCapFilter', 'enabled']}
            label={<FormattedMessage id="pages.stockAlert.enableMarketCap" defaultMessage="启用市值筛选" />}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name={['marketCapFilter', 'ranges']}
            label={<FormattedMessage id="pages.stockAlert.marketCapRanges" defaultMessage="市值范围配置" />}
            rules={[{ required: true, message: '请设置市值范围' }]}
          >
            <Form.List name={['marketCapFilter', 'ranges']}>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} style={{ 
                      border: '1px solid #e8e8e8', 
                      borderRadius: '8px', 
                      padding: '16px', 
                      marginBottom: '16px',
                      backgroundColor: '#fafafa'
                    }}>
                      <Row gutter={16} style={{ marginBottom: 16, alignItems: 'center' }}>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'minMarketCap']}
                            label={<FormattedMessage id="pages.stockAlert.minMarketCap" defaultMessage="最小市值 (亿美元)" />}
                            rules={[{ required: true, message: '请输入最小市值' }]}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'maxMarketCap']}
                            label={<FormattedMessage id="pages.stockAlert.maxMarketCap" defaultMessage="最大市值 (亿美元)" />}
                            rules={[{ required: true, message: '请输入最大市值' }]}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'changePercentThreshold']}
                            label={<FormattedMessage id="pages.stockAlert.thresholdPercent" defaultMessage="涨跌幅阈值 (%)" />}
                            rules={[{ required: true, message: '请输入涨跌幅阈值' }]}
                          >
                            <InputNumber 
                              min={0} 
                              max={100} 
                              step={0.1} 
                              style={{ width: '100%' }}
                              addonAfter="%"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'minAmount']}
                            label={<FormattedMessage id="pages.stockAlert.minAmount" defaultMessage="最少成交金额 (万美元)" />}
                            rules={[{ required: true, message: '请输入最少成交金额' }]}
                          >
                            <InputNumber min={0} style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Form.Item
                            {...restField}
                            name={[name, 'enabled']}
                            label={<FormattedMessage id="pages.stockAlert.marketCapRange.enable" defaultMessage="启用" />}
                            valuePropName="checked"
                          >
                            <Switch />
                          </Form.Item>
                        </Col>
                        <Col span={3}>
                          <Button 
                            type="link" 
                            danger 
                            onClick={() => remove(name)}
                            style={{ marginTop: 30 }}
                          >
                            <FormattedMessage id="pages.stockAlert.marketCapRange.delete" defaultMessage="删除" />
                          </Button>
                        </Col>
                      </Row>
                    </div>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add({ 
                      minMarketCap: 0, 
                      maxMarketCap: 1000, 
                      enabled: false, 
                      changePercentThreshold: 3.0, 
                      minAmount: 100 
                    })} block>
                      <FormattedMessage id="pages.stockAlert.addMarketCapRange" defaultMessage="添加市值范围" />
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={configLoading}>
                <FormattedMessage id="pages.stockAlert.saveConfig" defaultMessage="保存配置" />
              </Button>
              <Button onClick={() => setConfigVisible(false)}>
                <FormattedMessage id="pages.stockAlert.cancel" defaultMessage="取消" />
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 生成策略配置弹窗 */}
      <StrategyConfigModal
        open={strategyConfigVisible}
        onOpenChange={setStrategyConfigVisible}
        stockCode={currentStockAlert?.stockCode || ''}
        stockName={currentStockAlert?.stockName}
        marketCap={currentStockAlert?.marketCap}
        onSuccess={handleStrategyConfigSuccess}
      />
    </div>
  );
};

export default StockAlert; 