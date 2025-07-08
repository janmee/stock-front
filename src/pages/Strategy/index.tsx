import {
  Button,
  Tabs,
  message
} from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useLocation } from '@umijs/max';
import StrategyJobList from './components/StrategyJobList';
import StrategyStockList from './components/StrategyStockList';
import StrategyUserStockList from './components/StrategyUserStockList';
import StrategyConfigTemplateManagement from './components/StrategyConfigTemplateManagement';
import AccountFundAllocation from './components/AccountFundAllocation';
import UserTimeSegmentTemplateManagement from './components/UserTimeSegmentTemplateManagement';
import StockTimeSegmentTemplateManagement from './components/StockTimeSegmentTemplateManagement';
import { PlusOutlined } from '@ant-design/icons';

const TabPane = Tabs.TabPane;

/**
 * 策略管理页面
 */
const StrategyPage: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  
  // 当前活动标签
  const [activeTab, setActiveTab] = useState<string>('3');
  
  // 策略ID (当用户选择一个策略任务后设置，用于过滤关联的股票和用户股票关系)
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | undefined>(undefined);
  const [selectedStrategyName, setSelectedStrategyName] = useState<string | undefined>(undefined);
  
  // 编辑股票代码参数
  const [editStockCode, setEditStockCode] = useState<string | undefined>(undefined);
  
  // 新增：标识是否需要打开时段配置对话框
  const [openTimeSegmentConfig, setOpenTimeSegmentConfig] = useState<boolean>(false);
  
  // 新增：用于策略用户股票关系的预填数据
  const [userStockPreFillData, setUserStockPreFillData] = useState<{
    strategyId: number;
    strategyName: string;
    stockCode: string;
    accountInfo: any;
  } | undefined>(undefined);
  
  // 策略任务列表引用，用于刷新列表
  const strategyJobListRef = useRef<any>();
  // 策略股票关系列表引用
  const strategyStockListRef = useRef<any>();
  // 策略用户股票关系列表引用
  const strategyUserStockListRef = useRef<any>();
  
  // 处理URL参数
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tab = urlParams.get('tab');
    const strategyId = urlParams.get('strategyId');
    const stockCode = urlParams.get('editStockCode');
    
    if (tab) {
      setActiveTab(tab);
    }
    
    if (strategyId) {
      setSelectedStrategyId(parseInt(strategyId));
    }
    
    if (stockCode) {
      setEditStockCode(stockCode);
    }
  }, [location.search]);
  
  // 处理标签切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // 清除编辑参数
    setEditStockCode(undefined);
  };
  
  // 当用户选择一个策略任务
  const handleStrategySelected = (strategyId: number, strategyName: string) => {
    setSelectedStrategyId(strategyId);
    setSelectedStrategyName(strategyName);
    
    // 如果当前在策略股票关系标签或策略用户股票关系标签，则刷新对应列表
    if (activeTab === '2') {
      strategyStockListRef.current?.reload();
    } else if (activeTab === '3') {
      strategyUserStockListRef.current?.reload();
    }
  };
  
  // 清除已选策略
  const clearSelectedStrategy = () => {
    setSelectedStrategyId(undefined);
    setSelectedStrategyName(undefined);
    
    // 刷新当前标签页
    if (activeTab === '2') {
      strategyStockListRef.current?.reload();
    } else if (activeTab === '3') {
      strategyUserStockListRef.current?.reload();
    }
  };
  
  // 处理股票点击事件
  const handleStockClick = async (strategyId: number, stockCode: string) => {
    try {
      // 获取策略名称
      const strategyRes = await import('@/services/ant-design-pro/api').then(api => 
        api.listStrategyJob({
          current: 1,
          pageSize: 100,
        })
      );
      
      let strategyName: string = '';
      if (strategyRes && strategyRes.data) {
        const strategy = strategyRes.data.find((item: any) => item.id === strategyId);
        if (strategy) {
          strategyName = strategy.name || '';
        }
      }
      
      // 设置策略ID、策略名称和股票代码
      setSelectedStrategyId(strategyId);
      setSelectedStrategyName(strategyName || `策略${strategyId}`);
      setEditStockCode(stockCode);
      
      // 标识需要打开时段配置对话框
      setOpenTimeSegmentConfig(true);
      
      // 切换到策略标的tab
      setActiveTab('2');
      
      // 给一点时间让组件渲染完成，然后通知StrategyStockList组件
      setTimeout(() => {
        if (strategyStockListRef.current) {
          strategyStockListRef.current.reload();
        }
      }, 100);
      
      message.success(`已切换到策略标的页面，正在打开股票 ${stockCode} 的时段配置对话框`);
    } catch (error) {
      console.error('获取策略信息失败:', error);
      message.error('获取策略信息失败');
    }
  };
  
  // 处理从策略标的页面跳转到策略用户股票关系tab
  const handleJumpToUserStock = async (strategyId: number, stockCode: string, accountInfo?: any) => {
    try {
      // 获取策略名称
      const strategyRes = await import('@/services/ant-design-pro/api').then(api => 
        api.listStrategyJob({
          current: 1,
          pageSize: 100,
        })
      );
      
      let strategyName: string = '';
      if (strategyRes && strategyRes.data) {
        const strategy = strategyRes.data.find((item: any) => item.id === strategyId);
        if (strategy) {
          strategyName = strategy.name || '';
        }
      }
      
      // 构建预填数据
      const preFillData = {
        strategyId,
        strategyName: strategyName || `策略${strategyId}`,
        stockCode,
        accountInfo,
      };
      
      console.log('跳转到策略用户股票关系，预填数据:', preFillData);
      
      // 设置预填数据
      setUserStockPreFillData(preFillData);
      
      // 设置策略ID和名称
      setSelectedStrategyId(strategyId);
      setSelectedStrategyName(strategyName || `策略${strategyId}`);
      
      // 切换到策略用户股票关系tab
      setActiveTab('3');
      
      // 给更多时间让组件渲染完成，然后通知组件打开新增弹窗
      setTimeout(() => {
        console.log('尝试打开新增弹窗，ref:', strategyUserStockListRef.current);
        if (strategyUserStockListRef.current && strategyUserStockListRef.current.openCreateModal) {
          console.log('调用openCreateModal方法，预填数据:', preFillData);
          strategyUserStockListRef.current.openCreateModal(preFillData);
        } else {
          console.warn('无法找到openCreateModal方法或组件引用');
        }
      }, 300); // 增加延迟时间
      
      message.success(`已切换到策略用户股票关系页面，准备为账户 ${accountInfo?.account} 配置股票 ${stockCode}`);
    } catch (error) {
      console.error('跳转到策略用户股票关系失败:', error);
      message.error('跳转失败');
    }
  };
  
  return (
    <PageContainer>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <TabPane 
          tab={<FormattedMessage id="pages.strategy.tabs.strategyUserStock" defaultMessage="Strategy User Stocks" />}
          key="3"
        >
          <StrategyUserStockList 
            ref={strategyUserStockListRef}
            strategyId={selectedStrategyId}
            strategyName={selectedStrategyName}
            onClearStrategy={clearSelectedStrategy}
            onStockClick={handleStockClick}
            preFillData={userStockPreFillData}
            onPreFillDataUsed={() => setUserStockPreFillData(undefined)}
          />
        </TabPane>
        
        <TabPane 
          tab={<FormattedMessage id="pages.strategy.tabs.strategyStock" defaultMessage="Strategy Stocks" />}
          key="2"
        >
          <StrategyStockList 
            ref={strategyStockListRef}
            strategyId={selectedStrategyId}
            strategyName={selectedStrategyName}
            onClearStrategy={clearSelectedStrategy}
            editStockCode={editStockCode}
            onEditComplete={() => setEditStockCode(undefined)}
            onJumpToUserStock={handleJumpToUserStock}
            openTimeSegmentConfig={openTimeSegmentConfig}
            onTimeSegmentConfigComplete={() => setOpenTimeSegmentConfig(false)}
          />
        </TabPane>

        <TabPane 
          tab={<FormattedMessage id="pages.strategy.tabs.userTimeSegmentTemplate" defaultMessage="用户档位配置" />}
          key="6"
        >
          <UserTimeSegmentTemplateManagement 
            strategyId={selectedStrategyId}
            strategyName={selectedStrategyName}
          />
        </TabPane>

        <TabPane 
          tab={<FormattedMessage id="pages.strategy.tabs.stockTimeSegmentTemplate" defaultMessage="股票档位配置" />}
          key="7"
        >
          <StockTimeSegmentTemplateManagement 
            strategyId={selectedStrategyId}
            strategyName={selectedStrategyName}
          />
        </TabPane>

        <TabPane 
          tab="账户资金配比"
          key="5"
        >
          <AccountFundAllocation />
        </TabPane>

        <TabPane 
          tab="配置模版管理"
          key="4"
        >
          <StrategyConfigTemplateManagement />
        </TabPane>
        
        
        <TabPane 
          tab={<FormattedMessage id="pages.strategy.tabs.strategyJob" defaultMessage="Strategy Jobs" />} 
          key="1"
        >
          <StrategyJobList 
            ref={strategyJobListRef}
            onStrategySelected={handleStrategySelected}
          />
        </TabPane>
        
      </Tabs>
    </PageContainer>
  );
};

export default StrategyPage; 