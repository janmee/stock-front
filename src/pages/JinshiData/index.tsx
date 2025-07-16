import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  List,
  Typography,
  Tag,
  Space,
  Image,
  Button,
  Spin,
  message,
  Select,
  Input,
  Row,
  Col,
  Divider,
  Alert,
  Empty,
  DatePicker,
  Switch,
} from 'antd';
import {
  ReloadOutlined,
  ClockCircleOutlined,
  FireOutlined,
  SearchOutlined,
  GlobalOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useIntl, FormattedMessage } from '@umijs/max';
import { getJinshiDataList, refreshJinshiData, type JinshiDataItem } from '@/services/jinshiData';
import moment from 'moment';
import dayjs from 'dayjs';
import styles from './index.less';

const { Text, Paragraph, Title } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;

const JinshiData: React.FC = () => {
  const intl = useIntl();
  const [dataList, setDataList] = useState<JinshiDataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [current, setCurrent] = useState<number>(1);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({
    channel: '',
    type: undefined as number | undefined,
    important: undefined as number | undefined,
    keyword: '',
    startTime: undefined as string | undefined,
    endTime: undefined as string | undefined,
  });
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // 获取数据
  const fetchData = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    
    try {
      // 计算maxTime（用于分页）- 只在没有时间范围且不显示全部时使用
      let maxTime: string | undefined;
      const hasTimeRange = filters.startTime || filters.endTime;
      
      if (!hasTimeRange && !showAll && page > 1 && dataList.length > 0) {
        const lastItem = dataList[dataList.length - 1];
        maxTime = lastItem.time;
      }

      const params = {
        current: page,
        pageSize: showAll ? 10000 : 20, // 显示全部时使用较大的pageSize
        ...filters,
        maxTime: hasTimeRange || showAll ? undefined : maxTime, // 有时间范围或显示全部时不使用maxTime
      };

      const response = await getJinshiDataList(params);
      
      if (response.success) {
        const newData = response.data || [];
        
        if (isRefresh || page === 1 || showAll) {
          setDataList(newData);
        } else {
          setDataList(prev => [...prev, ...newData]);
        }
        
        // 检查是否还有更多数据
        if (showAll) {
          setHasMore(false); // 显示全部时不需要继续加载
        } else if (hasTimeRange) {
          setHasMore(newData.length === 20 && page * 20 < 1000); // 限制最大查询条数
        } else {
          setHasMore(newData.length === 20);
        }
        setCurrent(page);
      } else {
        message.error(response.errorMessage || intl.formatMessage({ id: 'component.message.fetchDataFailed' }));
      }
    } catch (error) {
      console.error('Failed to fetch jinshi data:', error);
      message.error(intl.formatMessage({ id: 'component.message.fetchDataFailed' }));
    } finally {
      setLoading(false);
    }
  }, [loading, dataList, filters, showAll, intl]);

  // 手动刷新
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // 只有在没有时间范围时才调用API刷新
      if (!filters.startTime && !filters.endTime) {
        await refreshJinshiData();
      }
      await fetchData(1, true);
      message.success(intl.formatMessage({ id: 'pages.jinshiData.refreshSuccess', defaultMessage: '刷新成功' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.jinshiData.refreshFailed', defaultMessage: '刷新失败' }));
    } finally {
      setRefreshing(false);
    }
  };

  // 搜索
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, keyword: value }));
    setDataList([]);
    setCurrent(1);
    setHasMore(true);
  };

  // 筛选变化
  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setDataList([]);
    setCurrent(1);
    setHasMore(true);
  };

  // 时间范围变化
  const handleTimeRangeChange = (dates: any, dateStrings: [string, string]) => {
    setFilters(prev => ({
      ...prev,
      startTime: dateStrings[0] || undefined,
      endTime: dateStrings[1] || undefined,
    }));
    setDataList([]);
    setCurrent(1);
    setHasMore(true);
  };

  // 显示全部数据切换
  const handleShowAllChange = (checked: boolean) => {
    setShowAll(checked);
    setDataList([]);
    setCurrent(1);
    setHasMore(!checked);
  };

  // 处理新闻链接点击
  const handleNewsClick = (link: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  // 无限滚动
  useEffect(() => {
    if (!loadingRef.current || showAll) return; // 显示全部时禁用无限滚动

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchData(current + 1);
        }
      },
      { threshold: 0.1 }
    );

    observerRef.current.observe(loadingRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, loading, current, showAll, fetchData]); // 添加showAll依赖

  // 初始化加载
  useEffect(() => {
    fetchData(1, true);
  }, [filters]);

  // 格式化时间
  const formatTime = (time: string) => {
    return moment(time).format('MM-DD HH:mm:ss');
  };

  // 格式化内容
  const formatContent = (content: string, itemId: string) => {
    if (!content) return '';
    // 移除HTML标签，保留纯文本
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    const isExpanded = expandedItems.has(itemId);
    const shouldTruncate = cleanContent.length > 200;
    
    if (!shouldTruncate || isExpanded) {
      return cleanContent;
    }
    
    return cleanContent.substring(0, 200) + '...';
  };

  // 切换内容展开/收起
  const toggleContent = (itemId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 获取类型标签颜色
  const getTypeColor = (type: number) => {
    switch (type) {
      case 0: return 'blue';
      case 1: return 'green';
      case 2: return 'orange';
      default: return 'default';
    }
  };

  // 获取类型标签文本
  const getTypeText = (type: number) => {
    switch (type) {
      case 0: return intl.formatMessage({ id: 'pages.jinshiData.type.news', defaultMessage: '快讯' });
      case 1: return intl.formatMessage({ id: 'pages.jinshiData.type.other', defaultMessage: '其他' });
      case 2: return intl.formatMessage({ id: 'pages.jinshiData.type.analysis', defaultMessage: '分析' });
      default: return intl.formatMessage({ id: 'pages.jinshiData.type.unknown', defaultMessage: '未知' });
    }
  };

  return (
    <div className={styles.container}>
      <Card 
        title={
          <Space>
            <GlobalOutlined />
            <FormattedMessage id="menu.list.jinshi-data" defaultMessage="金时数据" />
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={refreshing}
            onClick={handleRefresh}
          >
            <FormattedMessage id="pages.jinshiData.refresh" defaultMessage="刷新" />
          </Button>
        }
        className={styles.card}
      >
        {/* 筛选器 */}
        <Row gutter={[16, 16]} className={styles.filters}>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder={intl.formatMessage({ id: 'pages.jinshiData.search.placeholder', defaultMessage: '搜索关键词' })}
              allowClear
              onSearch={handleSearch}
              className={styles.searchInput}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              placeholder={[
                intl.formatMessage({ id: 'pages.jinshiData.startTime', defaultMessage: '开始时间' }),
                intl.formatMessage({ id: 'pages.jinshiData.endTime', defaultMessage: '结束时间' })
              ]}
              onChange={handleTimeRangeChange}
              style={{ width: '100%' }}
              suffixIcon={<CalendarOutlined />}
              showTime={{
                format: 'HH:mm:ss',
                defaultValue: [dayjs('00:00:00', 'HH:mm:ss'), dayjs('23:59:59', 'HH:mm:ss')]
              }}
              format="YYYY-MM-DD HH:mm:ss"
            />
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              placeholder={intl.formatMessage({ id: 'pages.jinshiData.filter.type', defaultMessage: '类型' })}
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('type', value)}
            >
              <Option value={0}>{getTypeText(0)}</Option>
              <Option value={1}>{getTypeText(1)}</Option>
              <Option value={2}>{getTypeText(2)}</Option>
            </Select>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Select
              placeholder={intl.formatMessage({ id: 'pages.jinshiData.filter.important', defaultMessage: '重要性' })}
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('important', value)}
            >
              <Option value={0}>{intl.formatMessage({ id: 'pages.jinshiData.important.normal', defaultMessage: '一般' })}</Option>
              <Option value={1}>{intl.formatMessage({ id: 'pages.jinshiData.important.high', defaultMessage: '重要' })}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Space>
              <UnorderedListOutlined />
              <Switch
                checked={showAll}
                onChange={handleShowAllChange}
                checkedChildren={intl.formatMessage({ id: 'pages.jinshiData.showAll', defaultMessage: '显示全部' })}
                unCheckedChildren={intl.formatMessage({ id: 'pages.jinshiData.pagination', defaultMessage: '分页显示' })}
              />
            </Space>
          </Col>
        </Row>

        <Divider />

        {/* 时间范围提示 */}
        {(filters.startTime || filters.endTime) && (
          <Alert
            message={
              <FormattedMessage 
                id="pages.jinshiData.timeRangeMode" 
                defaultMessage="时间范围查询模式：仅查询数据库中的历史数据，不获取最新数据" 
              />
            }
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 显示全部数据提示 */}
        {showAll && (
          <Alert
            message={
              <FormattedMessage 
                id="pages.jinshiData.showAllMode" 
                defaultMessage="显示全部数据模式：已加载所有数据，无需滚动加载" 
              />
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 数据列表 */}
        {dataList.length === 0 && !loading ? (
          <Empty 
            description={<FormattedMessage id="pages.jinshiData.empty" defaultMessage="暂无数据" />}
          />
        ) : (
          <List
            dataSource={dataList}
            renderItem={(item: JinshiDataItem) => {
              const itemId = `${item.id}_${item.time}`;
              const isExpanded = expandedItems.has(itemId);
              const cleanContent = item.content ? item.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') : '';
              const shouldShowToggle = cleanContent.length > 200;
              
              return (
                <List.Item 
                  className={`${styles.listItem} ${item.link ? styles.clickableItem : ''}`}
                  onClick={() => item.link && handleNewsClick(item.link)}
                >
                  <div className={styles.itemContent}>
                    {/* 头部信息 */}
                    <div className={styles.itemHeader}>
                      <Space wrap>
                        <ClockCircleOutlined />
                        <Text type="secondary" className={styles.time}>
                          {formatTime(item.time)}
                        </Text>
                        <Tag color={getTypeColor(item.type)}>
                          {getTypeText(item.type)}
                        </Tag>
                        {item.important === 1 && (
                          <Tag color="red" icon={<FireOutlined />}>
                            <FormattedMessage id="pages.jinshiData.important.high" defaultMessage="重要" />
                          </Tag>
                        )}
                        {item.link && (
                          <Tag color="blue" icon={<GlobalOutlined />}>
                            <FormattedMessage id="pages.jinshiData.hasLink" defaultMessage="链接" />
                          </Tag>
                        )}
                      </Space>
                      <Space>
                        {item.isLock && (
                          <Tag color="purple">VIP</Tag>
                        )}
                      </Space>
                    </div>

                    {/* 标题 */}
                    {item.title && (
                      <Title level={5} className={styles.title}>
                        {item.title}
                      </Title>
                    )}

                    {/* 内容 */}
                    <div>
                      <Paragraph className={styles.content}>
                        {formatContent(item.content, itemId)}
                      </Paragraph>
                      {shouldShowToggle && (
                        <Button 
                          type="link" 
                          size="small" 
                          className={styles.toggleButton}
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止事件冒泡
                            toggleContent(itemId);
                          }}
                          icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                        >
                          {isExpanded 
                            ? intl.formatMessage({ id: 'pages.jinshiData.collapse', defaultMessage: '收起' })
                            : intl.formatMessage({ id: 'pages.jinshiData.expand', defaultMessage: '展开' })
                          }
                        </Button>
                      )}
                    </div>

                    {/* 图片 */}
                    {item.pic && (
                      <div className={styles.imageContainer}>
                        <Image
                          src={item.pic}
                          alt="news image"
                          className={styles.newsImage}
                          placeholder={
                            <div className={styles.imagePlaceholder}>
                              <Spin />
                            </div>
                          }
                        />
                      </div>
                    )}

                    {/* VIP内容提示 */}
                    {item.isLock && item.vipDesc && (
                      <Alert
                        message={item.vipDesc}
                        type="info"
                        showIcon
                        className={styles.vipAlert}
                      />
                    )}
                  </div>
                </List.Item>
              );
            }}
          />
        )}

        {/* 加载更多触发器 */}
        {!showAll && hasMore && (
          <div ref={loadingRef} className={styles.loadingTrigger}>
            {loading && (
              <div className={styles.loading}>
                <Spin />
                <Text type="secondary">
                  <FormattedMessage id="component.loading" defaultMessage="加载中..." />
                </Text>
              </div>
            )}
          </div>
        )}

        {/* 没有更多数据提示 */}
        {!showAll && !hasMore && dataList.length > 0 && (
          <div className={styles.noMore}>
            <Text type="secondary">
              <FormattedMessage id="pages.jinshiData.noMore" defaultMessage="没有更多数据了" />
            </Text>
          </div>
        )}

        {/* 显示全部数据时的数据统计 */}
        {showAll && dataList.length > 0 && (
          <div className={styles.totalCount}>
            <Divider>
              <Text type="secondary">
                <FormattedMessage 
                  id="pages.jinshiData.totalDataCount" 
                  defaultMessage="共加载 {count} 条数据"
                  values={{ count: dataList.length }}
                />
              </Text>
            </Divider>
          </div>
        )}
      </Card>
    </div>
  );
};

export default JinshiData; 