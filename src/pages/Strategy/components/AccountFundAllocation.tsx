import React, { useEffect, useRef, useState } from 'react';
import { Button, message, Tooltip } from 'antd';
import {
  ActionType,
  ProColumns,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl } from '@umijs/max';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  listAccountInfo,
  listStrategyUserStock,
  listStrategyStock
} from '@/services/ant-design-pro/api';

/**
 * 账户资金配比组件
 */
const AccountFundAllocation: React.FC = () => {
  const [strategyStockMap, setStrategyStockMap] = useState<Map<string, API.StrategyStockItem>>(new Map());
  const [userStockList, setUserStockList] = useState<API.StrategyUserStockItem[]>([]);
  const actionRef = useRef<ActionType>();
  const intl = useIntl();

  // 默认的BuyRatioConfig配置
  const getDefaultBuyRatioConfig = () => ({
    firstShareRatio: 3.0,
    extraShares: [
      { drop: 7, ratio: 3, secondStage: false },
      { drop: 7, ratio: 3, secondStage: false },
      { drop: 9, ratio: 4.6, secondStage: false },
      { drop: 9, ratio: 4.6, secondStage: false },
      { drop: 11, ratio: 6, secondStage: false },
      { drop: 11, ratio: 6, secondStage: false },
      { drop: 11, ratio: 7.7, secondStage: false }
    ]
  });

  // 解析BuyRatioConfig
  const parseBuyRatioConfig = (buyRatioConfigStr?: string) => {
    if (!buyRatioConfigStr) {
      return getDefaultBuyRatioConfig();
    }
    try {
      return JSON.parse(buyRatioConfigStr);
    } catch (error) {
      console.warn('解析BuyRatioConfig失败，使用默认配置:', error);
      return getDefaultBuyRatioConfig();
    }
  };

  // 计算单次资金
  const calculateSingleAmount = (record: API.StrategyUserStockItem, buyRatioConfig: any) => {
    if (!record.maxAmount) return 0;
    const firstShareRatio = (buyRatioConfig.firstShareRatio || 3.0) / 100;
    return record.maxAmount * firstShareRatio;
  };

  // 计算单天最大持有资金
  const calculateDailyMaxHolding = (record: API.StrategyUserStockItem, singleAmount: number) => {
    const unsoldStackLimit = record.unsoldStackLimit || 4;
    return singleAmount * unsoldStackLimit;
  };

  // 计算最大持有资金
  const calculateMaxHolding = (record: API.StrategyUserStockItem, buyRatioConfig: any, singleAmount: number) => {
    if (!record.maxAmount) return 0;
    const limitStartShares = record.limitStartShares || 9;
    const totalFundShares = record.totalFundShares || 18;
    const extraShares = buyRatioConfig.extraShares || [];
    
    // 第一部分：单次资金 * limitStartShares
    const firstPart = singleAmount * limitStartShares;
    
    // 第二部分：计算额外份数的比例总和
    const extraSharesCount = totalFundShares - limitStartShares;
    let extraRatioSum = 0;
    
    for (let i = 0; i < Math.min(extraSharesCount, extraShares.length); i++) {
      extraRatioSum += (extraShares[i].ratio || 0) / 100;
    }
    
    const secondPart = record.maxAmount * extraRatioSum;
    
    return firstPart + secondPart;
  };

  // 获取策略股票配置
  const getStrategyStockConfig = (strategyId?: number, stockCode?: string) => {
    if (!strategyId || !stockCode) return null;
    const key = `${strategyId}_${stockCode}`;
    return strategyStockMap.get(key) || null;
  };

  // 计算账户的资金配比数据
  const calculateAccountFundData = (account: string, accountTotalAmount: number) => {
    const accountUserStocks = userStockList.filter(item => item.account === account);
    
    let totalDailyMaxHolding = 0;
    let totalMaxHolding = 0;
    
    accountUserStocks.forEach(userStock => {
      const strategyStockConfig = getStrategyStockConfig(userStock.strategyId, userStock.stockCode);
      const buyRatioConfig = parseBuyRatioConfig(strategyStockConfig?.buyRatioConfig);
      const singleAmount = calculateSingleAmount(userStock, buyRatioConfig);
      const dailyMaxHolding = calculateDailyMaxHolding(userStock, singleAmount);
      const maxHolding = calculateMaxHolding(userStock, buyRatioConfig, singleAmount);
      
      totalDailyMaxHolding += dailyMaxHolding;
      totalMaxHolding += maxHolding;
    });
    
    return {
      totalDailyMaxHolding,
      totalMaxHolding,
      dailyMaxHoldingRatio: accountTotalAmount > 0 ? (totalDailyMaxHolding / accountTotalAmount) * 100 : 0,
      maxHoldingRatio: accountTotalAmount > 0 ? (totalMaxHolding / accountTotalAmount) * 100 : 0,
      stockCount: accountUserStocks.length
    };
  };

  // 获取策略股票配置和用户股票关系数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 获取所有策略股票配置
        const strategyStockRes = await listStrategyStock({
          current: 1,
          pageSize: 1000,
        });
        
        if (strategyStockRes && strategyStockRes.data) {
          const newMap = new Map<string, API.StrategyStockItem>();
          strategyStockRes.data.forEach((item: API.StrategyStockItem) => {
            if (item.strategyId && item.stockCode) {
              const key = `${item.strategyId}_${item.stockCode}`;
              newMap.set(key, item);
            }
          });
          setStrategyStockMap(newMap);
        }

        // 获取所有用户股票关系数据
        const userStockRes = await listStrategyUserStock({
          current: 1,
          pageSize: 10000,
        });
        
        if (userStockRes && userStockRes.data) {
          setUserStockList(userStockRes.data);
        }
      } catch (error) {
        console.error('获取数据失败:', error);
      }
    };
    
    fetchData();
  }, []);

  // 表格列定义
  const columns: ProColumns<API.AccountInfo>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      hideInSearch: true,
      width: 80,
    },
    {
      title: '账户',
      dataIndex: 'account',
      sorter: true,
      width: 120,
    },
    {
      title: '账户名称',
      dataIndex: 'name',
      sorter: true,
      width: 120,
    },
    {
      title: '总资金',
      dataIndex: 'totalAmount',
      valueType: 'money',
      hideInSearch: true,
      sorter: true,
      width: 120,
      render: (_, record) => record.totalAmount ? `$${record.totalAmount.toFixed(2)}` : '-',
    },
    {
      title: '可用资金',
      dataIndex: 'availableAmount', 
      valueType: 'money',
      hideInSearch: true,
      width: 120,
      render: (_, record) => record.availableAmount ? `$${record.availableAmount.toFixed(2)}` : '-',
    },
    {
      title: '证券市值',
      dataIndex: 'marketVal',
      valueType: 'money',
      hideInSearch: true,
      width: 120,
      render: (_, record) => record.marketVal ? `$${record.marketVal.toFixed(2)}` : '-',
    },
    {
      title: '配置股票数量',
      hideInSearch: true,
      width: 120,
      render: (_, record) => {
        const fundData = calculateAccountFundData(record.account, record.totalAmount || 0);
        return fundData.stockCount;
      },
    },
    {
      title: (
        <span>
          <>每天最大持有资金总和</>
          <Tooltip title="该账户配置的所有股票每天最大持有资金的总和">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      hideInSearch: true,
      width: 180,
      render: (_, record) => {
        const fundData = calculateAccountFundData(record.account, record.totalAmount || 0);
        const percentageText = fundData.dailyMaxHoldingRatio > 0 ? ` (${fundData.dailyMaxHoldingRatio.toFixed(2)}%)` : '';
        return fundData.totalDailyMaxHolding > 0 ? 
          `$${fundData.totalDailyMaxHolding.toFixed(2)}${percentageText}` : '-';
      },
    },
    {
      title: (
        <span>
          <>最大持有资金总和</>
          <Tooltip title="该账户配置的所有股票最大持有资金的总和">
            <InfoCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </span>
      ),
      hideInSearch: true,
      width: 180,
      render: (_, record) => {
        const fundData = calculateAccountFundData(record.account, record.totalAmount || 0);
        const percentageText = fundData.maxHoldingRatio > 0 ? ` (${fundData.maxHoldingRatio.toFixed(2)}%)` : '';
        return fundData.totalMaxHolding > 0 ? 
          `$${fundData.totalMaxHolding.toFixed(2)}${percentageText}` : '-';
      },
    },
    {
      title: '风险偏好',
      dataIndex: 'riskPreference',
      hideInSearch: true,
      width: 100,
      render: (_, record) => {
        const riskPreference = (record as any).riskPreference;
        return riskPreference ? `${(riskPreference * 100).toFixed(1)}%` : '-';
      },
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      hideInSearch: true,
      width: 100,
      valueEnum: {
        '-1': { text: '未知', status: 'Default' },
        '0': { text: '安全', status: 'Success' },
        '1': { text: '预警', status: 'Warning' },
        '2': { text: '危险', status: 'Error' },
        '3': { text: '绝对安全', status: 'Success' },
        '4': { text: '危险-期权', status: 'Error' },
      },
    }
  ];

  return (
    <>
      <ProTable<API.AccountInfo, API.PageParams>
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => [
          <Button
            key="refresh"
            onClick={() => {
              actionRef.current?.reload();
              // 重新获取策略股票配置和用户股票关系数据
              const fetchData = async () => {
                try {
                  const strategyStockRes = await listStrategyStock({
                    current: 1,
                    pageSize: 1000,
                  });
                  
                  if (strategyStockRes && strategyStockRes.data) {
                    const newMap = new Map<string, API.StrategyStockItem>();
                    strategyStockRes.data.forEach((item: API.StrategyStockItem) => {
                      if (item.strategyId && item.stockCode) {
                        const key = `${item.strategyId}_${item.stockCode}`;
                        newMap.set(key, item);
                      }
                    });
                    setStrategyStockMap(newMap);
                  }

                  const userStockRes = await listStrategyUserStock({
                    current: 1,
                    pageSize: 10000,
                  });
                  
                  if (userStockRes && userStockRes.data) {
                    setUserStockList(userStockRes.data);
                  }
                } catch (error) {
                  console.error('刷新数据失败:', error);
                }
              };
              fetchData();
            }}
          >
            <ReloadOutlined /> 刷新数据
          </Button>,
        ]}
        request={async (params) => {
          try {
            const response = await listAccountInfo(params, {});
            if (response && response.data) {
              return {
                data: response.data,
                success: true,
                total: response.total || response.data.length
              };
            }
            return {
              data: [],
              success: false,
              total: 0
            };
          } catch (error) {
            message.error('获取账户信息失败');
            return {
              data: [],
              success: false,
              total: 0
            };
          }
        }}
        columns={columns}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
    </>
  );
};

export default AccountFundAllocation; 