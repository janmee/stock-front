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
  Tabs,
  Tooltip,
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
  ThunderboltOutlined,
  PlusOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useIntl, FormattedMessage } from '@umijs/max';
import { getJinshiDataList, refreshJinshiData, type JinshiDataItem } from '@/services/jinshiData';
import { getFutuNewsDataList, refreshFutuNewsData, type FutuNewsDataItem } from '@/services/futuNewsData';
import moment from 'moment';
import dayjs from 'dayjs';
import styles from './index.less';
import StrategyConfigModal from '@/components/StrategyConfigModal';
import { request } from '@umijs/max';

const { Text, Paragraph, Title } = Typography;
const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

const JinshiData: React.FC = () => {
  const intl = useIntl();
  const [activeTab, setActiveTab] = useState('futu'); // 默认激活富途快讯tab
  
  // 金时数据状态
  const [jinshiDataList, setJinshiDataList] = useState<JinshiDataItem[]>([]);
  const [jinshiLoading, setJinshiLoading] = useState<boolean>(false);
  const [jinshiRefreshing, setJinshiRefreshing] = useState<boolean>(false);
  const [jinshiHasMore, setJinshiHasMore] = useState<boolean>(true);
  const [jinshiCurrent, setJinshiCurrent] = useState<number>(1);
  const [jinshiShowAll, setJinshiShowAll] = useState<boolean>(false);
  const [jinshiExpandedItems, setJinshiExpandedItems] = useState<Set<string>>(new Set());
  const [jinshiFilters, setJinshiFilters] = useState({
    channel: '',
    type: undefined as number | undefined,
    important: undefined as number | undefined,
    keyword: '',
    startTime: undefined as string | undefined,
    endTime: undefined as string | undefined,
  });
  
  // 富途快讯数据状态
  const [futuDataList, setFutuDataList] = useState<FutuNewsDataItem[]>([]);
  const [futuLoading, setFutuLoading] = useState<boolean>(false);
  const [futuRefreshing, setFutuRefreshing] = useState<boolean>(false);
  const [futuHasMore, setFutuHasMore] = useState<boolean>(true);
  const [futuCurrent, setFutuCurrent] = useState<number>(1);
  const [futuShowAll, setFutuShowAll] = useState<boolean>(false);
  const [futuExpandedItems, setFutuExpandedItems] = useState<Set<string>>(new Set());
  const [futuFilters, setFutuFilters] = useState({
    newsType: undefined as number | undefined,
    level: undefined as number | undefined,
    keyword: '',
    startTime: undefined as string | undefined,
    endTime: undefined as string | undefined,
    stockCode: '',
    hasStockInfo: true, // 默认包含股票信息
    market: 'US', // 默认美股市场
    sortKey: 'time', // 默认按快讯时间排序
    sortOrder: 'descend' as 'ascend' | 'descend', // 默认降序
  });
  
  // 策略配置相关状态
  const [strategyConfigVisible, setStrategyConfigVisible] = useState(false);
  const [currentFutuNewsItem, setCurrentFutuNewsItem] = useState<FutuNewsDataItem | null>(null);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);

  // 获取金时数据
  const fetchJinshiData = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    if (jinshiLoading) return;
    
    setJinshiLoading(true);
    
    try {
      // 计算maxTime（用于分页）- 只在没有时间范围且不显示全部时使用
      let maxTime: string | undefined;
      const hasTimeRange = jinshiFilters.startTime || jinshiFilters.endTime;
      
      if (!hasTimeRange && !jinshiShowAll && page > 1 && jinshiDataList.length > 0) {
        const lastItem = jinshiDataList[jinshiDataList.length - 1];
        maxTime = lastItem.time;
      }

      const params = {
        current: page,
        pageSize: jinshiShowAll ? 10000 : 20, // 显示全部时使用较大的pageSize
        ...jinshiFilters,
        maxTime: hasTimeRange || jinshiShowAll ? undefined : maxTime, // 有时间范围或显示全部时不使用maxTime
      };

      const response = await getJinshiDataList(params);
      
      if (response.success) {
        const newData = response.data || [];
        
        if (isRefresh || page === 1 || jinshiShowAll) {
          setJinshiDataList(newData);
        } else {
          setJinshiDataList(prev => [...prev, ...newData]);
        }
        
        // 检查是否还有更多数据
        if (jinshiShowAll) {
          setJinshiHasMore(false); // 显示全部时不需要继续加载
        } else if (hasTimeRange) {
          setJinshiHasMore(newData.length === 20 && page * 20 < 1000); // 限制最大查询条数
        } else {
          setJinshiHasMore(newData.length === 20);
        }
        setJinshiCurrent(page);
      } else {
        message.error(response.errorMessage || intl.formatMessage({ id: 'component.message.fetchDataFailed' }));
      }
    } catch (error) {
      console.error('Failed to fetch jinshi data:', error);
      message.error(intl.formatMessage({ id: 'component.message.fetchDataFailed' }));
    } finally {
      setJinshiLoading(false);
    }
  }, [jinshiLoading, jinshiDataList, jinshiFilters, jinshiShowAll, intl]);

  // 获取富途快讯数据
  const fetchFutuData = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    if (futuLoading) return;
    
    setFutuLoading(true);
    
    try {
      // 计算maxTime（用于分页）- 只在没有时间范围且不显示全部时使用
      let maxTime: string | undefined;
      const hasTimeRange = futuFilters.startTime || futuFilters.endTime;
      
      if (!hasTimeRange && !futuShowAll && page > 1 && futuDataList.length > 0) {
        const lastItem = futuDataList[futuDataList.length - 1];
        maxTime = lastItem.time;
      }

      const params = {
        current: page,
        pageSize: futuShowAll ? 10000 : 20, // 显示全部时使用较大的pageSize
        ...futuFilters,
        maxTime: hasTimeRange || futuShowAll ? undefined : maxTime, // 有时间范围或显示全部时不使用maxTime
      };

      const response = await getFutuNewsDataList(params);
      
      if (response.success) {
        const newData = response.data || [];
        
        if (isRefresh || page === 1 || futuShowAll) {
          setFutuDataList(newData);
        } else {
          setFutuDataList(prev => [...prev, ...newData]);
        }
        
        // 检查是否还有更多数据
        if (futuShowAll) {
          setFutuHasMore(false); // 显示全部时不需要继续加载
        } else if (hasTimeRange) {
          setFutuHasMore(newData.length === 20 && page * 20 < 1000); // 限制最大查询条数
        } else {
          setFutuHasMore(newData.length === 20);
        }
        setFutuCurrent(page);
      } else {
        message.error(response.errorMessage || intl.formatMessage({ id: 'component.message.fetchDataFailed' }));
      }
    } catch (error) {
      console.error('Failed to fetch futu news data:', error);
      message.error(intl.formatMessage({ id: 'component.message.fetchDataFailed' }));
    } finally {
      setFutuLoading(false);
    }
  }, [futuLoading, futuDataList, futuFilters, futuShowAll, intl]);

  // 手动刷新金时数据
  const handleJinshiRefresh = async () => {
    setJinshiRefreshing(true);
    try {
      // 只有在没有时间范围时才调用API刷新
      if (!jinshiFilters.startTime && !jinshiFilters.endTime) {
        await refreshJinshiData();
      }
      await fetchJinshiData(1, true);
      message.success(intl.formatMessage({ id: 'pages.jinshiData.refreshSuccess', defaultMessage: '刷新成功' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.jinshiData.refreshFailed', defaultMessage: '刷新失败' }));
    } finally {
      setJinshiRefreshing(false);
    }
  };

  // 手动刷新富途快讯数据
  const handleFutuRefresh = async () => {
    setFutuRefreshing(true);
    try {
      // 只有在没有时间范围时才调用API刷新
      if (!futuFilters.startTime && !futuFilters.endTime) {
        await refreshFutuNewsData();
      }
      await fetchFutuData(1, true);
      message.success(intl.formatMessage({ id: 'pages.futuNewsData.refreshSuccess', defaultMessage: '刷新成功' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'pages.futuNewsData.refreshFailed', defaultMessage: '刷新失败' }));
    } finally {
      setFutuRefreshing(false);
    }
  };

  // 金时数据搜索
  const handleJinshiSearch = (value: string) => {
    setJinshiFilters(prev => ({ ...prev, keyword: value }));
    setJinshiDataList([]);
    setJinshiCurrent(1);
    setJinshiHasMore(true);
  };

  // 富途快讯数据搜索
  const handleFutuSearch = (value: string) => {
    setFutuFilters(prev => ({ ...prev, keyword: value }));
    setFutuDataList([]);
    setFutuCurrent(1);
    setFutuHasMore(true);
  };

  // 金时数据筛选变化
  const handleJinshiFilterChange = (key: string, value: any) => {
    setJinshiFilters(prev => ({ ...prev, [key]: value }));
    setJinshiDataList([]);
    setJinshiCurrent(1);
    setJinshiHasMore(true);
  };

  // 富途快讯数据筛选变化
  const handleFutuFilterChange = (key: string, value: any) => {
    setFutuFilters(prev => ({ ...prev, [key]: value }));
    setFutuDataList([]);
    setFutuCurrent(1);
    setFutuHasMore(true);
  };

  // 金时数据时间范围变化
  const handleJinshiTimeRangeChange = (dates: any, dateStrings: [string, string]) => {
    setJinshiFilters(prev => ({
      ...prev,
      startTime: dateStrings[0] || undefined,
      endTime: dateStrings[1] || undefined,
    }));
    setJinshiDataList([]);
    setJinshiCurrent(1);
    setJinshiHasMore(true);
  };

  // 富途快讯数据时间范围变化
  const handleFutuTimeRangeChange = (dates: any, dateStrings: [string, string]) => {
    setFutuFilters(prev => ({
      ...prev,
      startTime: dateStrings[0] || undefined,
      endTime: dateStrings[1] || undefined,
    }));
    setFutuDataList([]);
    setFutuCurrent(1);
    setFutuHasMore(true);
  };

  // 金时数据显示全部数据切换
  const handleJinshiShowAllChange = (checked: boolean) => {
    setJinshiShowAll(checked);
    setJinshiDataList([]);
    setJinshiCurrent(1);
    setJinshiHasMore(!checked);
  };

  // 富途快讯数据显示全部数据切换
  const handleFutuShowAllChange = (checked: boolean) => {
    setFutuShowAll(checked);
    setFutuDataList([]);
    setFutuCurrent(1);
    setFutuHasMore(!checked);
  };

  // 富途快讯排序处理
  const handleFutuSort = (field: string, order: 'ascend' | 'descend') => {
    setFutuFilters(prev => ({ ...prev, sortKey: field, sortOrder: order }));
    setFutuDataList([]);
    setFutuCurrent(1);
    setFutuHasMore(true);
  };

  // 处理新闻链接点击
  const handleNewsClick = (link: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  // 处理生成策略配置
  const handleGenerateStrategy = (item: FutuNewsDataItem) => {
    setCurrentFutuNewsItem(item);
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
        if (activeTab === 'futu') {
          fetchFutuData(futuCurrent, true);
        }
      } else {
        message.error(response.errorMessage || `策略${enabled ? '启用' : '禁用'}失败`);
      }
    } catch (error) {
      message.error(`策略${enabled ? '启用' : '禁用'}失败`);
    }
  };

  // 处理跳转到策略配置
  const handleJumpToStrategyConfig = async (stockCode: string) => {
    try {
      // 根据股票代码查找策略配置
      const response = await request('/api/strategy/stock/page', {
        method: 'GET',
        params: {
          current: 1,
          pageSize: 10,
          stockCode: stockCode,
          status: '1', // 只查找启用的策略
        },
      });

      if (response.success && response.data && response.data.length > 0) {
        const strategyStock = response.data[0]; // 取第一个匹配的策略配置
        const strategyId = strategyStock.strategyId;
        
        // 构建跳转URL，包含必要的参数
        const params = new URLSearchParams({
          tab: '2', // 策略标的tab
          strategyId: strategyId.toString(),
          editStockCode: stockCode,
        });
        
        // 在新窗口中打开策略管理页面
        const url = `/strategy?${params.toString()}`;
        window.open(url, '_blank');
        
        message.success(`正在打开策略配置页面，股票：${stockCode}`);
      } else {
        message.error(`未找到股票 ${stockCode} 的策略配置`);
      }
    } catch (error) {
      console.error('获取策略配置失败:', error);
      message.error('获取策略配置失败');
    }
  };

  // 策略配置成功后的回调
  const handleStrategyConfigSuccess = () => {
    message.success('策略配置创建成功！');
    setStrategyConfigVisible(false);
    // 刷新数据以更新策略配置状态
    if (activeTab === 'futu') {
      fetchFutuData(futuCurrent, true);
    }
  };

  // 无限滚动
  useEffect(() => {
    if (!loadingRef.current || (activeTab === 'futu' ? futuShowAll : jinshiShowAll)) return; // 显示全部时禁用无限滚动

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && (activeTab === 'futu' ? futuHasMore : jinshiHasMore) && (activeTab === 'futu' ? !futuLoading : !jinshiLoading)) {
          if (activeTab === 'futu') {
            fetchFutuData(futuCurrent + 1);
          } else {
            fetchJinshiData(jinshiCurrent + 1);
          }
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
  }, [activeTab, futuHasMore, futuLoading, futuCurrent, futuShowAll, jinshiHasMore, jinshiLoading, jinshiCurrent, jinshiShowAll, fetchFutuData, fetchJinshiData]);

  // 初始化加载
  useEffect(() => {
    if (activeTab === 'futu') {
      fetchFutuData(1, true);
    } else {
      fetchJinshiData(1, true);
    }
  }, [activeTab, futuFilters, jinshiFilters]);

  // 格式化时间
  const formatTime = (time: string) => {
    return moment(time).format('MM-DD HH:mm:ss');
  };

  // 格式化内容
  const formatContent = (content: string, itemId: string, isJinshi: boolean = true) => {
    if (!content) return '';
    // 移除HTML标签，保留纯文本
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
    const expandedItems = isJinshi ? jinshiExpandedItems : futuExpandedItems;
    const isExpanded = expandedItems.has(itemId);
    const shouldTruncate = cleanContent.length > 200;
    
    if (!shouldTruncate || isExpanded) {
      return cleanContent;
    }
    
    return cleanContent.substring(0, 200) + '...';
  };

  // 切换内容展开/收起
  const toggleContent = (itemId: string, isJinshi: boolean = true) => {
    if (isJinshi) {
      setJinshiExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    } else {
      setFutuExpandedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
          newSet.delete(itemId);
        } else {
          newSet.add(itemId);
        }
        return newSet;
      });
    }
  };

  // 获取金时数据类型标签颜色
  const getJinshiTypeColor = (type: number) => {
    switch (type) {
      case 0: return 'blue';
      case 1: return 'green';
      case 2: return 'orange';
      default: return 'default';
    }
  };

  // 获取金时数据类型标签文本
  const getJinshiTypeText = (type: number) => {
    switch (type) {
      case 0: return intl.formatMessage({ id: 'pages.jinshiData.type.news', defaultMessage: '快讯' });
      case 1: return intl.formatMessage({ id: 'pages.jinshiData.type.other', defaultMessage: '其他' });
      case 2: return intl.formatMessage({ id: 'pages.jinshiData.type.analysis', defaultMessage: '分析' });
      default: return intl.formatMessage({ id: 'pages.jinshiData.type.unknown', defaultMessage: '未知' });
    }
  };

  // 获取富途快讯类型标签颜色
  const getFutuTypeColor = (type: number) => {
    switch (type) {
      case 1: return 'blue';
      case 2: return 'green';
      case 3: return 'orange';
      default: return 'default';
    }
  };

  // 获取富途快讯类型标签文本
  const getFutuTypeText = (type: number) => {
    switch (type) {
      case 1: return intl.formatMessage({ id: 'pages.futuNewsData.type.news', defaultMessage: '快讯' });
      case 2: return intl.formatMessage({ id: 'pages.futuNewsData.type.analysis', defaultMessage: '分析' });
      case 3: return intl.formatMessage({ id: 'pages.futuNewsData.type.report', defaultMessage: '报告' });
      default: return intl.formatMessage({ id: 'pages.futuNewsData.type.unknown', defaultMessage: '未知' });
    }
  };

  // 检查是否可以生成策略配置
  const canGenerateStrategy = (item: FutuNewsDataItem) => {
    return item.market === 'US' && item.stockCode && item.stockCode.trim() !== '';
  };

  // 解析市值信息
  const parseMarketCap = (marketCapStr: string): number | undefined => {
    if (!marketCapStr) return undefined;
    try {
      // 尝试解析市值字符串，例如 "123.45B" -> 1234.5
      const numericPart = parseFloat(marketCapStr.replace(/[^0-9.]/g, ''));
      if (marketCapStr.includes('B')) {
        return numericPart * 10; // 转换为亿美元
      } else if (marketCapStr.includes('M')) {
        return numericPart / 100; // 转换为亿美元
      }
      return numericPart;
    } catch (error) {
      console.error('解析市值失败:', marketCapStr, error);
      return undefined;
    }
  };

  // 渲染金时数据列表
  const renderJinshiDataList = () => {
    if (jinshiDataList.length === 0 && !jinshiLoading) {
      return <Empty description={<FormattedMessage id="pages.jinshiData.empty" defaultMessage="暂无数据" />} />;
    }

    return (
      <List
        dataSource={jinshiDataList}
        renderItem={(item: JinshiDataItem) => {
          const itemId = `${item.id}_${item.time}`;
          const isExpanded = jinshiExpandedItems.has(itemId);
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
                    <Tag color={getJinshiTypeColor(item.type)}>
                      {getJinshiTypeText(item.type)}
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
                    {formatContent(item.content, itemId, true)}
                  </Paragraph>
                  {shouldShowToggle && (
                    <Button 
                      type="link" 
                      size="small" 
                      className={styles.toggleButton}
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡
                        toggleContent(itemId, true);
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
    );
  };

  // 渲染富途快讯数据列表
  const renderFutuDataList = () => {
    if (futuDataList.length === 0 && !futuLoading) {
      return <Empty description={<FormattedMessage id="pages.futuNewsData.empty" defaultMessage="暂无数据" />} />;
    }

    // 应用排序
    const sortedData = futuDataList; // 排序逻辑移至后端

    return (
      <List
        dataSource={sortedData}
        renderItem={(item: FutuNewsDataItem) => {
          const itemId = `${item.id}_${item.time}`;
          const isExpanded = futuExpandedItems.has(itemId);
          const cleanContent = item.content ? item.content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') : '';
          const shouldShowToggle = cleanContent.length > 200;
          const canGenerate = canGenerateStrategy(item);
          
          return (
            <List.Item 
              className={`${styles.listItem} ${item.detailUrl ? styles.clickableItem : ''}`}
              onClick={() => item.detailUrl && handleNewsClick(item.detailUrl)}
            >
              <div className={styles.itemContent}>
                {/* 头部信息 */}
                <div className={styles.itemHeader}>
                  <Space wrap>
                    <ClockCircleOutlined />
                    <Text type="secondary" className={styles.time}>
                      {formatTime(item.time)}
                    </Text>
                    <Tag color={getFutuTypeColor(item.newsType)}>
                      {getFutuTypeText(item.newsType)}
                    </Tag>
                    {item.level > 0 && (
                      <Tag color="red" icon={<FireOutlined />}>
                        <FormattedMessage id="pages.futuNewsData.level.high" defaultMessage="重要" />
                      </Tag>
                    )}
                    {item.detailUrl && (
                      <Tag color="blue" icon={<GlobalOutlined />}>
                        <FormattedMessage id="pages.futuNewsData.hasLink" defaultMessage="链接" />
                      </Tag>
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
                    {formatContent(item.content, itemId, false)}
                  </Paragraph>
                  {shouldShowToggle && (
                    <Button 
                      type="link" 
                      size="small" 
                      className={styles.toggleButton}
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止事件冒泡
                        toggleContent(itemId, false);
                      }}
                      icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
                    >
                      {isExpanded 
                        ? intl.formatMessage({ id: 'pages.futuNewsData.collapse', defaultMessage: '收起' })
                        : intl.formatMessage({ id: 'pages.futuNewsData.expand', defaultMessage: '展开' })
                      }
                    </Button>
                  )}
                </div>

                {/* 股票信息 */}
                {item.stockCode && (
                  <div style={{ marginTop: 8 }} onClick={(e) => {
                    e.stopPropagation(); // 阻止事件冒泡
                    // 根据股票代码构建富途URL
                    let stockUrl = '';
                    if (item.stockCode && item.market) {
                      // 富途股票URL格式：https://www.futunn.com/stock/股票代码+市场
                      stockUrl = `https://www.futunn.com/stock/${item.stockCode}-${item.market}`;
                    }
                    if (stockUrl) {
                      window.open(stockUrl, '_blank');
                    }
                  }}>
                    <Space wrap>
                      <Tag color="blue">{item.stockName || item.stockCode}</Tag>
                      {/* 股票代码链接 */}
                      <Tag 
                        color="green" 
                        icon={<ThunderboltOutlined />}
                        style={{ cursor: 'pointer' }}
                      >
                        {item.stockCode}
                      </Tag>
                      {item.price && <Tag color="default">快讯时价格: {item.price}</Tag>}
                      {item.changeRatio && (
                        <Tag color={item.changeRatio.startsWith('-') ? 'green' : 'red'}>
                          快讯时涨跌幅: {item.changeRatio}
                        </Tag>
                      )}
                      {item.pmahChangeRatio && (
                        <Tag color={item.pmahChangeRatio.startsWith('-') ? 'green' : 'red'}>
                          快讯时盘前盘后涨跌幅: {item.pmahChangeRatio}
                        </Tag>
                      )}
                      {item.currentChangePercent && (
                        <Tag color={String(item.currentChangePercent).startsWith('-') ? 'green' : 'red'}>
                          当前涨跌幅: {Number(item.currentChangePercent).toFixed(2)}%
                        </Tag>
                      )}
                      {item.stockMarketCap && (
                        <Tag color="purple">
                          市值: {item.stockMarketCap}亿美元
                        </Tag>
                      )}
                      {/* 策略配置按钮 */}
                      {canGenerate && (
                        <>
                          {!item.hasStrategyConfig ? (
                            <Tooltip title="生成策略配置">
                              <Button
                                type="primary"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={(e) => {
                                  e.stopPropagation(); // 阻止事件冒泡
                                  handleGenerateStrategy(item);
                                }}
                                style={{ marginLeft: 8 }}
                              >
                                策略配置
                              </Button>
                            </Tooltip>
                          ) : (
                            <Space style={{ marginLeft: 8 }}>
                              {item.strategyEnabled ? (
                                <Tooltip title="停止策略">
                                  <Button
                                    type="primary"
                                    danger
                                    size="small"
                                    icon={<ThunderboltOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation(); // 阻止事件冒泡
                                      handleStrategyControl(item.stockCode, false);
                                    }}
                                  >
                                    停止策略
                                  </Button>
                                </Tooltip>
                              ) : (
                                <Tooltip title="启动策略">
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<ThunderboltOutlined />}
                                    onClick={(e) => {
                                      e.stopPropagation(); // 阻止事件冒泡
                                      handleStrategyControl(item.stockCode, true);
                                    }}
                                  >
                                    启动
                                  </Button>
                                </Tooltip>
                              )}
                              <Tooltip title="跳转策略配置">
                                <Button
                                  size="small"
                                  icon={<SettingOutlined />}
                                  onClick={(e) => {
                                    e.stopPropagation(); // 阻止事件冒泡
                                    handleJumpToStrategyConfig(item.stockCode);
                                  }}
                                >
                                  配置
                                </Button>
                              </Tooltip>
                              <Tooltip title="已配置策略">
                                <Button
                                  size="small"
                                  disabled
                                  icon={<PlusOutlined />}
                                >
                                  已配置
                                </Button>
                              </Tooltip>
                            </Space>
                          )}
                        </>
                      )}
                    </Space>
                  </div>
                )}
              </div>
            </List.Item>
          );
        }}
      />
    );
  };

  // 渲染筛选器
  const renderJinshiFilters = () => (
    <Row gutter={[16, 16]} className={styles.filters}>
      <Col xs={24} sm={12} md={6}>
        <Search
          placeholder={intl.formatMessage({ id: 'pages.jinshiData.search.placeholder', defaultMessage: '搜索关键词' })}
          allowClear
          onSearch={handleJinshiSearch}
          className={styles.searchInput}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <RangePicker
          placeholder={[
            intl.formatMessage({ id: 'pages.jinshiData.startTime', defaultMessage: '开始时间' }),
            intl.formatMessage({ id: 'pages.jinshiData.endTime', defaultMessage: '结束时间' })
          ]}
          onChange={handleJinshiTimeRangeChange}
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
          onChange={(value) => handleJinshiFilterChange('type', value)}
        >
          <Option value={0}>{getJinshiTypeText(0)}</Option>
          <Option value={1}>{getJinshiTypeText(1)}</Option>
          <Option value={2}>{getJinshiTypeText(2)}</Option>
        </Select>
      </Col>
      <Col xs={12} sm={6} md={3}>
        <Select
          placeholder={intl.formatMessage({ id: 'pages.jinshiData.filter.important', defaultMessage: '重要性' })}
          allowClear
          style={{ width: '100%' }}
          onChange={(value) => handleJinshiFilterChange('important', value)}
        >
          <Option value={0}>{intl.formatMessage({ id: 'pages.jinshiData.important.normal', defaultMessage: '一般' })}</Option>
          <Option value={1}>{intl.formatMessage({ id: 'pages.jinshiData.important.high', defaultMessage: '重要' })}</Option>
        </Select>
      </Col>
    </Row>
  );

  // 渲染富途快讯筛选器
  const renderFutuFilters = () => (
    <Row gutter={[16, 16]} className={styles.filters}>
      <Col xs={24} sm={12} md={6}>
        <Search
          placeholder={intl.formatMessage({ id: 'pages.futuNewsData.search.placeholder', defaultMessage: '搜索关键词' })}
          allowClear
          onSearch={handleFutuSearch}
          className={styles.searchInput}
        />
      </Col>
      <Col xs={24} sm={12} md={6}>
        <RangePicker
          placeholder={[
            intl.formatMessage({ id: 'pages.futuNewsData.startTime', defaultMessage: '开始时间' }),
            intl.formatMessage({ id: 'pages.futuNewsData.endTime', defaultMessage: '结束时间' })
          ]}
          onChange={handleFutuTimeRangeChange}
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
          placeholder={intl.formatMessage({ id: 'pages.futuNewsData.filter.type', defaultMessage: '类型' })}
          allowClear
          style={{ width: '100%' }}
          onChange={(value) => handleFutuFilterChange('newsType', value)}
        >
          <Option value={1}>{getFutuTypeText(1)}</Option>
          <Option value={2}>{getFutuTypeText(2)}</Option>
          <Option value={3}>{getFutuTypeText(3)}</Option>
        </Select>
      </Col>
      <Col xs={12} sm={6} md={3}>
        <Select
          placeholder={intl.formatMessage({ id: 'pages.futuNewsData.filter.level', defaultMessage: '级别' })}
          allowClear
          style={{ width: '100%' }}
          onChange={(value) => handleFutuFilterChange('level', value)}
        >
          <Option value={0}>{intl.formatMessage({ id: 'pages.futuNewsData.level.normal', defaultMessage: '一般' })}</Option>
          <Option value={1}>{intl.formatMessage({ id: 'pages.futuNewsData.level.high', defaultMessage: '重要' })}</Option>
        </Select>
      </Col>
      <Col xs={12} sm={6} md={3}>
        <Select
          placeholder={intl.formatMessage({ id: 'pages.futuNewsData.filter.market', defaultMessage: '市场' })}
          allowClear
          style={{ width: '100%' }}
          value={futuFilters.market}
          onChange={(value) => handleFutuFilterChange('market', value)}
        >
          <Option value="">{intl.formatMessage({ id: 'pages.futuNewsData.filter.market.all', defaultMessage: '全部市场' })}</Option>
          <Option value="US">{intl.formatMessage({ id: 'pages.futuNewsData.filter.market.us', defaultMessage: '美股' })}</Option>
          <Option value="HK">{intl.formatMessage({ id: 'pages.futuNewsData.filter.market.hk', defaultMessage: '港股' })}</Option>
          <Option value="SH">{intl.formatMessage({ id: 'pages.futuNewsData.filter.market.sh', defaultMessage: 'A股' })}</Option>
        </Select>
      </Col>
      <Col xs={12} sm={6} md={3}>
        <Select
          placeholder={intl.formatMessage({ id: 'pages.futuNewsData.filter.stockInfo', defaultMessage: '股票信息' })}
          allowClear
          style={{ width: '100%' }}
          value={futuFilters.hasStockInfo}
          onChange={(value) => handleFutuFilterChange('hasStockInfo', value)}
        >
          <Option value={true}>{intl.formatMessage({ id: 'pages.futuNewsData.hasStockInfo', defaultMessage: '包含股票' })}</Option>
          <Option value={false}>{intl.formatMessage({ id: 'pages.futuNewsData.noStockInfo', defaultMessage: '不包含股票' })}</Option>
        </Select>
      </Col>
      <Col xs={12} sm={6} md={3}>
        <Select
          placeholder="排序字段"
          allowClear
          style={{ width: '100%' }}
          value={futuFilters.sortKey || undefined}
          onChange={(value) => {
            if (value) {
              handleFutuSort(value, futuFilters.sortOrder);
            } else {
              setFutuFilters(prev => ({ ...prev, sortKey: 'time' }));
            }
          }}
        >
          <Option value="time">快讯时间</Option>
          <Option value="stockMarketCap">市值</Option>
          <Option value="changeRatio">快讯时涨跌幅</Option>
          <Option value="pmahChangeRatio">快讯时盘前涨跌幅</Option>
        </Select>
      </Col>
      <Col xs={12} sm={6} md={3}>
        <Select
          placeholder="排序方向"
          style={{ width: '100%' }}
          value={futuFilters.sortOrder}
          onChange={(value) => {
            if (futuFilters.sortKey) {
              handleFutuSort(futuFilters.sortKey, value);
            } else {
              setFutuFilters(prev => ({ ...prev, sortOrder: value }));
            }
          }}
          disabled={!futuFilters.sortKey}
        >
          <Option value="descend">降序</Option>
          <Option value="ascend">升序</Option>
        </Select>
      </Col>
    </Row>
  );

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
            loading={activeTab === 'futu' ? futuRefreshing : jinshiRefreshing}
            onClick={activeTab === 'futu' ? handleFutuRefresh : handleJinshiRefresh}
          >
            <FormattedMessage id="pages.jinshiData.refresh" defaultMessage="刷新" />
          </Button>
        }
        className={styles.card}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={
              <span>
                <ThunderboltOutlined />
                <FormattedMessage id="pages.jinshiData.tab.futu" defaultMessage="富途快讯" />
              </span>
            } 
            key="futu"
          >
            {/* 富途快讯筛选器 */}
            {renderFutuFilters()}

            <Divider />

            {/* 富途快讯时间范围提示 */}
            {(futuFilters.startTime || futuFilters.endTime) && (
              <Alert
                message={
                  <FormattedMessage 
                    id="pages.futuNewsData.timeRangeMode" 
                    defaultMessage="时间范围查询模式：仅查询数据库中的历史数据，不获取最新数据" 
                  />
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 富途快讯显示全部数据提示 */}
            {futuShowAll && (
              <Alert
                message={
                  <FormattedMessage 
                    id="pages.futuNewsData.showAllMode" 
                    defaultMessage="显示全部数据模式：已加载所有数据，无需滚动加载" 
                  />
                }
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* 富途快讯数据列表 */}
            {renderFutuDataList()}

            {/* 富途快讯加载更多触发器 */}
            {!futuShowAll && futuHasMore && (
              <div ref={loadingRef} className={styles.loadingTrigger}>
                {futuLoading && (
                  <div className={styles.loading}>
                    <Spin />
                    <Text type="secondary">
                      <FormattedMessage id="component.loading" defaultMessage="加载中..." />
                    </Text>
                  </div>
                )}
              </div>
            )}

            {/* 富途快讯没有更多数据提示 */}
            {!futuShowAll && !futuHasMore && futuDataList.length > 0 && (
              <div className={styles.noMore}>
                <Text type="secondary">
                  <FormattedMessage id="pages.futuNewsData.noMore" defaultMessage="没有更多数据了" />
                </Text>
              </div>
            )}

            {/* 富途快讯显示全部数据时的数据统计 */}
            {futuShowAll && futuDataList.length > 0 && (
              <div className={styles.totalCount}>
                <Divider>
                  <Text type="secondary">
                    <FormattedMessage 
                      id="pages.futuNewsData.totalDataCount" 
                      defaultMessage="共加载 {count} 条数据"
                      values={{ count: futuDataList.length }}
                    />
                  </Text>
                </Divider>
              </div>
            )}
          </TabPane>

          <TabPane 
            tab={
              <span>
                <GlobalOutlined />
                <FormattedMessage id="pages.jinshiData.tab.jinshi" defaultMessage="金时数据" />
              </span>
            } 
            key="jinshi"
          >
            {/* 金时数据筛选器 */}
            {renderJinshiFilters()}

            <Divider />

            {/* 金时数据时间范围提示 */}
            {(jinshiFilters.startTime || jinshiFilters.endTime) && (
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

            {/* 金时数据显示全部数据提示 */}
            {jinshiShowAll && (
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

            {/* 金时数据列表 */}
            {renderJinshiDataList()}

            {/* 金时数据加载更多触发器 */}
            {!jinshiShowAll && jinshiHasMore && (
              <div ref={loadingRef} className={styles.loadingTrigger}>
                {jinshiLoading && (
                  <div className={styles.loading}>
                    <Spin />
                    <Text type="secondary">
                      <FormattedMessage id="component.loading" defaultMessage="加载中..." />
                    </Text>
                  </div>
                )}
              </div>
            )}

            {/* 金时数据没有更多数据提示 */}
            {!jinshiShowAll && !jinshiHasMore && jinshiDataList.length > 0 && (
              <div className={styles.noMore}>
                <Text type="secondary">
                  <FormattedMessage id="pages.jinshiData.noMore" defaultMessage="没有更多数据了" />
                </Text>
              </div>
            )}

            {/* 金时数据显示全部数据时的数据统计 */}
            {jinshiShowAll && jinshiDataList.length > 0 && (
              <div className={styles.totalCount}>
                <Divider>
                  <Text type="secondary">
                    <FormattedMessage 
                      id="pages.jinshiData.totalDataCount" 
                      defaultMessage="共加载 {count} 条数据"
                      values={{ count: jinshiDataList.length }}
                    />
                  </Text>
                </Divider>
              </div>
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* 策略配置弹窗 */}
      <StrategyConfigModal
        open={strategyConfigVisible}
        onOpenChange={setStrategyConfigVisible}
        stockCode={currentFutuNewsItem?.stockCode || ''}
        stockName={currentFutuNewsItem?.stockName}
        marketCap={parseMarketCap(currentFutuNewsItem?.stockMarketCap || '')}
        onSuccess={handleStrategyConfigSuccess}
      />
    </div>
  );
};

export default JinshiData; 