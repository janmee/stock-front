import {
  Button,
  Tabs,
  message
} from 'antd';
import React, { useRef, useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import StrategyJobList from './components/StrategyJobList';
import StrategyStockList from './components/StrategyStockList';
import StrategyUserStockList from './components/StrategyUserStockList';
import StrategyConfigTemplateManagement from './components/StrategyConfigTemplateManagement';
import AccountFundAllocation from './components/AccountFundAllocation';
import { PlusOutlined } from '@ant-design/icons';

const TabPane = Tabs.TabPane;

/**
 * 策略管理页面
 */
const StrategyPage: React.FC = () => {
  const intl = useIntl();
  
  // 当前活动标签
  const [activeTab, setActiveTab] = useState<string>('3');
  
  // 策略ID (当用户选择一个策略任务后设置，用于过滤关联的股票和用户股票关系)
  const [selectedStrategyId, setSelectedStrategyId] = useState<number | undefined>(undefined);
  const [selectedStrategyName, setSelectedStrategyName] = useState<string | undefined>(undefined);
  
  // 策略任务列表引用，用于刷新列表
  const strategyJobListRef = useRef<any>();
  // 策略股票关系列表引用
  const strategyStockListRef = useRef<any>();
  // 策略用户股票关系列表引用
  const strategyUserStockListRef = useRef<any>();
  
  // 处理标签切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
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