import React, { useState, useEffect } from 'react';
import { Card, Button, List, message, Typography, Space, Select, Row, Col } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl, request } from 'umi';

const { Title, Paragraph } = Typography;
const { Option } = Select;

const LogsManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [downloadDays, setDownloadDays] = useState<string>('7');
  const intl = useIntl();

  // 获取日志文件列表
  const fetchLogFiles = async () => {
    setLoading(true);
    try {
      const result = await request('/api/logs/list', {
        method: 'GET',
      });
      
      if (result.success) {
        setLogFiles(result.data || []);
      } else {
        message.error(
          result.errorMessage ||
            intl.formatMessage({ id: 'pages.logs.fetchError', defaultMessage: '获取日志列表失败' }),
        );
      }
    } catch (error) {
      console.error('获取日志列表出错:', error);
      message.error(
        intl.formatMessage({ id: 'pages.logs.fetchError', defaultMessage: '获取日志列表失败' }),
      );
    } finally {
      setLoading(false);
    }
  };

  // 下载日志
  const downloadLogs = async () => {
    setLoading(true);
    try {
      // 对于下载文件，我们仍然需要使用fetch，但需要添加token头
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`/api/logs/download/${downloadDays}`, {
        headers: {
          token: token
        }
      });
      
      if (response.ok) {
        // 获取文件名
        const contentDisposition = response.headers.get('content-disposition') || '';
        const filenameMatch = contentDisposition.match(/filename=(.+)/);
        const filename = filenameMatch ? filenameMatch[1] : `system_logs_${downloadDays}days.zip`;

        // 下载文件
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        message.success(
          intl.formatMessage({
            id: 'pages.logs.downloadSuccess',
            defaultMessage: '日志下载成功',
          }),
        );
      } else {
        message.error(
          intl.formatMessage({
            id: 'pages.logs.downloadError',
            defaultMessage: '日志下载失败',
          }),
        );
      }
    } catch (error) {
      console.error('下载日志出错:', error);
      message.error(
        intl.formatMessage({
          id: 'pages.logs.downloadError',
          defaultMessage: '日志下载失败',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogFiles();
  }, []);

  // 日志时间范围选项
  const daysOptions = [
    { value: '1', label: intl.formatMessage({ id: 'pages.logs.downloadOneDay', defaultMessage: '1天' }) },
    { value: '2', label: intl.formatMessage({ id: 'pages.logs.downloadTwoDays', defaultMessage: '2天' }) },
    { value: '7', label: intl.formatMessage({ id: 'pages.logs.downloadSevenDays', defaultMessage: '7天' }) },
    { value: 'all', label: intl.formatMessage({ id: 'pages.logs.downloadAll', defaultMessage: '全部' }) }
  ];

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Typography>
          <Title level={4}>
            <FormattedMessage id="pages.logs.title" defaultMessage="系统日志管理" />
          </Title>
          <Paragraph>
            <FormattedMessage
              id="pages.logs.description"
              defaultMessage="此页面提供系统日志下载功能，方便查看和分析系统运行情况。"
            />
          </Paragraph>
        </Typography>

        <Row gutter={16} align="middle">
          <Col>
            <Select 
              value={downloadDays} 
              onChange={setDownloadDays}
              style={{ width: 120 }}
            >
              {daysOptions.map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              size="middle"
              loading={loading}
              onClick={downloadLogs}
            >
              <FormattedMessage id="pages.logs.download" defaultMessage="下载日志" />
            </Button>
          </Col>
        </Row>

        <Card title={intl.formatMessage({ id: 'pages.logs.fileList', defaultMessage: '日志文件列表' })}>
          <List
            loading={loading}
            bordered
            dataSource={logFiles}
            renderItem={(item) => (
              <List.Item>
                <FileTextOutlined style={{ marginRight: 8 }} /> {item}
              </List.Item>
            )}
            locale={{
              emptyText: intl.formatMessage({
                id: 'pages.logs.emptyList',
                defaultMessage: '暂无日志文件',
              }),
            }}
          />
        </Card>
      </Space>
    </Card>
  );
};

export default LogsManagement; 