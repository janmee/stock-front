// @ts-ignore
/* eslint-disable */
import {request} from '@umijs/max';
import { message } from 'antd';

/** 获取当前的用户 GET /api/login/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  const msg = await request<{
    data: API.CurrentUser;
  }>('/api/login/currentUser', {
    method: 'GET',
    ...(options || {}),
  });
  // 保留原始权限设置，不再强制设为admin
  // if (msg.data) {
  //   msg.data.access = 'admin'; // 临时设置所有用户为管理员权限
  // }
  return msg;
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/login/outLogin', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 登录接口 POST /api/login/account */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/login/account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取交易记录 GET /api/listFoundTrading */
export async function listFoundTrading(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    name?: string;
    code?: string;
  },
  sort: object,
  options?: { [key: string]: any },
) {
  return request<any>('/api/tradingRecord/list', {
    method: 'GET',
    params: {
      ...params,
      sortKey: sort ? Object.keys(sort)[0] : '',
      sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}

/** 获取交易记录 GET /api/listFoundTrading */
export async function listStockInfo(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    name?: string;
    code?: string;
  },
  sort: object,
  options?: { [key: string]: any },
) {
  return request<any>('/api/stockInfo/list', {
    method: 'GET',
    params: {
      ...params,
      sortKey: sort ? Object.keys(sort)[0] : '',
      sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}
/** 获取交易记录 GET /api/listFoundTrading */
export async function listOrderInfo(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    name?: string;
    code?: string;
    systemType?: string;
    accountName?: string;
  },
  sort: object,
  options?: { [key: string]: any },
) {
  return request('/api/orderInfo/list', {
    method: 'GET',
    params: {
      ...params,
      sortKey: sort ? Object.keys(sort)[0] : '',
      sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}

// 修改撤单API函数的路径
export async function cancelOrder(params: {
  orderNo: string;
}) {
  return request('/api/orderInfo/cancel', {  // 确保这个路径与后端API匹配
    method: 'GET',
    params: {
      ...params
    },
  });
}

// 撤销全部等待成交的订单
export async function cancelAllPendingOrders() {
  return request<API.Response<{
    totalCount: number;
    successCount: number;
    failedCount: number;
    failedOrders: string[];
    message: string;
  }>>('/api/orderInfo/cancelAllPendingOrders', {
    method: 'POST',
  });
}

// 撤销全部等待成交的卖出订单
export async function cancelAllPendingSellOrders() {
  return request<API.Response<{
    totalCount: number;
    successCount: number;
    failedCount: number;
    failedOrders: string[];
    message: string;
  }>>('/api/orderInfo/cancelAllPendingSellOrders', {
    method: 'POST',
  });
}

/** 获取历史价格 GET /api/listHistoryPrices */
export async function listHistoryPrices(
  params: {
    // query
    // /** 当前的页码 */
    // current?: number;
    // /** 页面的容量 */
    // pageSize?: number;
    // name?: string;
    code?: string;
  },
  // sort: object,
  options?: { [key: string]: any },
) {
  return request<any>('/api/stockInfo/listHistoryPrices', {
    method: 'GET',
    params: {
      ...params,
      // sortKey: sort ? Object.keys(sort)[0] : '',
      // sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}


/** 选中自选股票 GET /api/selectStockInfo */
export async function selectStockInfo(
  params: {
    code?: string;
  },
  // sort: object,
  options?: { [key: string]: any },
) {
  return request<any>('/api/stockInfo/selectStockInfo', {
    method: 'GET',
    params: {
      ...params,
      // sortKey: sort ? Object.keys(sort)[0] : '',
      // sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}


/** 取消自选股票 GET /api/cancelStockInfo */
export async function cancelStockInfo(
  params: {
    code?: string;
  },
  // sort: object,
  options?: { [key: string]: any },
) {
  return request<any>('/api/stockInfo/cancelStockInfo', {
    method: 'GET',
    params: {
      ...params,
      // sortKey: sort ? Object.keys(sort)[0] : '',
      // sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}

/** 获取历史价格 GET /api/listHistoryPrices */
export async function listIncreaseRate(
  params: {
    // query
    // /** 当前的页码 */
    // current?: number;
    // /** 页面的容量 */
    // pageSize?: number;
    // name?: string;
    code?: string;
  },
  // sort: object,
  options?: { [key: string]: any },
) {
  return request('/api/stockInfo/listIncreaseRate', {
    method: 'GET',
    params: {
      ...params,
      // sortKey: sort ? Object.keys(sort)[0] : '',
      // sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}

/** 获取历史价格 GET /api/listHistoryPrices */
export async function listTestData(
  params: {
    // query
    // /** 当前的页码 */
    // current?: number;
    // /** 页面的容量 */
    // pageSize?: number;
    name?: string;
    code?: string;
  },
  // sort: object,
  options?: { [key: string]: any },
) {
  return request<any>('/api/modelInfo/listTestData', {
    method: 'GET',
    params: {
      ...params,
      // sortKey: sort ? Object.keys(sort)[0] : '',
      // sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}

/** 获取历史价格 GET /api/listHistoryPrices */
export async function listValidateData(
  params: {
    // query
    // /** 当前的页码 */
    // current?: number;
    // /** 页面的容量 */
    // pageSize?: number;
    name?: string;
    code?: string;
  },
  // sort: object,
  options?: { [key: string]: any },
) {
  return request<any>('/api/modelInfo/listValidateData', {
    method: 'GET',
    params: {
      ...params,
      // sortKey: sort ? Object.keys(sort)[0] : '',
      // sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}

/** 获取定时任务 GET /api/job */
export async function listJob(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    name?: string;
    code?: string;
  },
  // sort: any,
  options?: { [key: string]: any },
) {
  return request<any>('/api/job/list', {
    method: 'GET',
    params: {
      ...params,
      // sortKey: Object.keys(sort)[0],
      // sortOrder: Object.values(sort)[0],
    },
    ...(options || {}),
  });
}

/** 新建规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<any>('/api/job/run', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<any>('/api/rule', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'DELETE',
    ...(options || {}),
  });
}

export async function createJob(options?: { [key: string]: any }) {
  return request<any>('/api/job/create', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function modifyJob(options?: { [key: string]: any }) {
  return request<API.ApiResponse>('/api/job/update', {
    method: 'PUT',
    ...(options || {}),
  });
}

export async function deleteJob(options?: { [key: string]: any }) {
  return request<any>('/api/job/delete', {
    method: 'DELETE',
    ...(options || {}),
  });
}

export async function runJob(options?: { [key: string]: any }) {
  return request<any>('/api/job/run', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function pauseJob(options?: { [key: string]: any }) {
  return request<any>('/api/job/pause', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function interruptJob(options?: { [key: string]: any }) {
  return request<any>('/api/job/interrupt', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function resumeJob(options?: { [key: string]: any }) {
  return request<any>('/api/job/resume', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function createStrategy(options?: { [key: string]: any }) {
  return request<any>('/api/strategy/create', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function modifyStrategy(options?: { [key: string]: any }) {
  return request<API.ApiResponse>('/api/strategy/update', {
    method: 'PUT',
    ...(options || {}),
  });
}

export async function chooseStrategy(options?: { [key: string]: any }) {
  return request<API.ApiResponse>('/api/strategy/choose', {
    method: 'POST',
    ...(options || {}),
  });
}

export async function deleteStrategy(options?: { [key: string]: any }) {
  return request<any>('/api/strategy/delete', {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取策略股票关系列表 GET /api/strategy/stock/page */
export async function listStrategyStock(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    strategyId?: number;
    stockCode?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.StrategyStockList>('/api/strategy/stock/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 图片上传接口 POST /api/login/account */
export async function upload(file: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/ocr/uploadImage', {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: file,
    ...(options || {}),
  });
}

/** 创建策略股票关系 POST /api/strategy/stock */
export async function createStrategyStock(body: API.StrategyStockItem, options?: { [key: string]: any }) {
  // 确保传递所有必要字段
  const requestData: API.StrategyStockItem = {
    strategyId: body.strategyId,
    strategyName: body.strategyName,
    stockCode: body.stockCode,
    profitRatio: body.profitRatio,
    maBelowPercent: body.maBelowPercent,
    maAbovePercent: body.maAbovePercent,
    levelPercent: body.levelPercent,
    intraUpPullbackPercent: body.intraUpPullbackPercent,
    intraDnBelowAvgPercent: body.intraDnBelowAvgPercent,
    intraDnDurationMinutes: body.intraDnDurationMinutes,
    intraUpDurationMinutes: body.intraUpDurationMinutes,
    unsoldStackLimit: body.unsoldStackLimit ?? 4,
    totalFundShares: body.totalFundShares ?? 18,
    limitStartShares: body.limitStartShares ?? 9,
    buyRatioConfig: body.buyRatioConfig,
    enableOpeningBuy: body.enableOpeningBuy,
    timeSegmentMaConfig: body.timeSegmentMaConfig,
    marketCapScale: body.marketCapScale,
    enableProfitSellBeforeClose: body.enableProfitSellBeforeClose,
    status: body.status
  };
  
  return request<API.Response<void>>('/api/strategy/stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: requestData,
    ...(options || {}),
  });
}

/** 更新策略股票关系 PUT /api/strategy/stock */
export async function updateStrategyStock(body: API.StrategyStockItem, options?: { [key: string]: any }) {
  // 确保传递所有必要字段
  const requestData: API.StrategyStockItem = {
    id: body.id,
    strategyId: body.strategyId,
    strategyName: body.strategyName,
    stockCode: body.stockCode,
    profitRatio: body.profitRatio,
    maBelowPercent: body.maBelowPercent,
    maAbovePercent: body.maAbovePercent,
    levelPercent: body.levelPercent,
    intraUpPullbackPercent: body.intraUpPullbackPercent,
    intraDnBelowAvgPercent: body.intraDnBelowAvgPercent,
    intraDnDurationMinutes: body.intraDnDurationMinutes,
    intraUpDurationMinutes: body.intraUpDurationMinutes,
    unsoldStackLimit: body.unsoldStackLimit ?? 4,
    totalFundShares: body.totalFundShares ?? 18,
    limitStartShares: body.limitStartShares ?? 9,
    buyRatioConfig: body.buyRatioConfig,
    enableOpeningBuy: body.enableOpeningBuy,
    timeSegmentMaConfig: body.timeSegmentMaConfig,
    marketCapScale: body.marketCapScale,
    enableProfitSellBeforeClose: body.enableProfitSellBeforeClose,
    status: body.status
  };
  
  return request<API.Response<void>>('/api/strategy/stock', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: requestData,
    ...(options || {}),
  });
}

/** 删除策略股票关系 DELETE /api/strategy/stock/{id} */
export async function deleteStrategyStock(body: API.StrategyStockItem, options?: { [key: string]: any }) {
  return request<API.Response<void>>(`/api/strategy/stock/${body.id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** 文件下载接口 Get /api/ocr/download**/
export async function download(file: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/ocr/downloadExcel', {
    method: 'GET',
    // headers: {
    //   'Content-Type': 'multipart/form-data',
    // },
    responseType : 'blob',
    ...(options || {}),
  });


}

/** 获取账户列表 GET /api/account/list */
export async function listAccountInfo(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    account?: string;
    enable?: boolean;
  },
  sort: object,
  options?: { [key: string]: any },
) {
  try {
    const response = await request<API.Response<API.AccountInfo[]>>('/api/accountInfo/list', {
      method: 'GET',
      params: {
        ...params,
        sortKey: sort ? Object.keys(sort)[0] : '',
        sortOrder: sort ? Object.values(sort)[0] : '',
      },
      ...(options || {}),
    });
    
    // 打印响应结果以进行调试
    console.log('账户列表API返回数据:', response);
    
    // 后端直接返回列表数据，需要包装成ProTable期望的格式
    return {
      data: response.data || [],
      total: response.total || 0,
      success: response.success || true,
    };
  } catch (error) {
    console.error('获取账户列表出错:', error);
    return {
      data: [],
      total: 0,
      success: false,
    };
  }
}

/** 获取账户资金配比列表 GET /api/accountInfo/fundAllocation */
export async function listAccountFundAllocation(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    account?: string;
    enable?: boolean;
  },
  sort: object,
  options?: { [key: string]: any },
) {
  try {
    const response = await request<API.Response<API.AccountInfo[]>>('/api/accountInfo/fundAllocation', {
      method: 'GET',
      params: {
        ...params,
        sortKey: sort ? Object.keys(sort)[0] : '',
        sortOrder: sort ? Object.values(sort)[0] : '',
      },
      ...(options || {}),
    });
    
    // 打印响应结果以进行调试
    console.log('账户资金配比列表API返回数据:', response);
    
    // 后端直接返回列表数据，需要包装成ProTable期望的格式
    return {
      data: response.data || [],
      total: response.total || 0,
      success: response.success || true,
    };
  } catch (error) {
    console.error('获取账户资金配比列表出错:', error);
    return {
      data: [],
      total: 0,
      success: false,
    };
  }
}

/** 更新账户状态 POST /api/accountInfo/status */
export async function updateAccountStatus(
  params: {
    id: number;
    enable?: boolean;
  },
  options?: { [key: string]: any },
) {
  return request('/api/accountInfo/status', {
    method: 'PUT',
    data: params,
    ...(options || {}),
  });
}

/** 更新账户信息 POST /api/accountInfo */
export async function updateAccountInfo(
  params: {
    id: number;
    account?: string;
    name?: string;
    host?: string;
    port?: number;
    tradePassword?: string;
    availableAmount?: number;
    totalAmount?: number;
    power?: number;
    master?: boolean;
    follow?: string;
    enable?: boolean;
  },
  options?: { [key: string]: any },
) {
  return request('/api/accountInfo', {
    method: 'PUT',
    data: params,
    ...(options || {}),
  });
}

/** 创建账户 POST /api/accountInfo */
export async function createAccountInfo(
  params: {
    account: string;
    name: string;
    host: string;
    port: number;
    tradePassword: string;
    master?: boolean;
    follow?: string;
  },
  options?: { [key: string]: any },
) {
  return request('/api/accountInfo', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 删除账户 DELETE /api/accountInfo/{id} */
export async function deleteAccountInfo(id: number, options?: { [key: string]: any }) {
  return request<API.ApiResponse>(`/api/accountInfo/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 获取定投列表 GET /api/dingtou */
export async function fetchDingtouList(
  params: {
    current?: number;
    pageSize?: number;
    account?: string;
    code?: string;
    enable?: boolean;
  },
  sort: object,
  options?: { [key: string]: any },
) {
  return request('/api/dingtou', {
    method: 'GET',
    params: {
      ...params,
      sortKey: sort ? Object.keys(sort)[0] : '',
      sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
}

/** 获取定投详情 GET /api/dingtou/{id} */
export async function fetchDingtouById(id: number, options?: { [key: string]: any }) {
  return request(`/api/dingtou/${id}`, {
    method: 'GET',
    ...(options || {}),
  });
}

/** 创建定投 POST /api/dingtou */
export async function createDingtou(params: Record<string, any>) {
  return request('/api/dingtou', {
    method: 'POST',
    data: params,
  });
}

/** 更新定投 PUT /api/dingtou/{id} */
export async function updateDingtou(params: Record<string, any>) {
  return request(`/api/dingtou/${params.id}`, {
    method: 'PUT',
    data: params,
  });
}

/** 删除定投 DELETE /api/dingtou/{id} */
export async function deleteDingtou(id: number, options?: { [key: string]: any }) {
  return request(`/api/dingtou/${id}`, {
    method: 'DELETE',
    ...(options || {}),
  });
}

/** 更新定投状态 PUT /api/dingtou/status */
export async function updateDingtouStatus(
  params: {
    id: number;
    enable: boolean;
  },
  options?: { [key: string]: any },
) {
  return request('/api/dingtou/status', {
    method: 'PUT',
    data: params,
    ...(options || {}),
  });
}

/** 获取账户列表 GET /api/account/list */
export async function fetchAccountList(
  params: {
    current?: number;
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<{
    data: {
      list: API.AccountInfo[];
      total: number;
    };
  }>('/api/account/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 批量交易 POST /api/orderInfo/batchTrade */
export async function batchTrade(data: {
  accounts: string[];
  code: string;
  number: number;
  orderType: 1 | 2; // 1-普通订单(限价)  2-市价订单
  trdSide: 1 | 2; // 1-买入, 2-卖出
  price?: number;
  sellTriggerType?: 'percentage' | 'amount' | 'limit';
  sellTriggerValue?: number;
  timeForce?: number; // 0-不撤单有效, 1-撤单有效
  quantityType?: 'fixed' | 'percentage'; // 数量计算方式：fixed-指定数量，percentage-按总资金占比
  fundPercentage?: number; // 资金占比（当quantityType为percentage时使用）
}) {
  return request<API.Response<boolean>>('/api/orderInfo/batchTrade', {
    method: 'POST',
    data,
  });
}

/** 查询持仓 */
export async function queryStockPosition(params: { account: string }) {
  return request<API.Response<API.PositionObj[]>>('/api/accountInfo/queryStockPosition', {
    method: 'GET',
    params,
  });
}

/** 获取账户收益列表 GET /api/accountInfo/profit */
export async function fetchProfitList(
  params: {
    startTime?: string;
    endTime?: string;
    accounts?: string;
  },
  options?: { [key: string]: any },
) {
  return request<{
    success: boolean;
    data: {
      [key: string]: {
        date: string;
        profitPercentage: number;
      }[];
    };
  }>('/api/accountInfo/profit', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 执行单一策略回测 GET /api/backtest/run */
export async function runBacktest(params: {
  stockCode: string;
  indexCode?: string;
  initialCapital?: number;
  investAmount?: number;
  maxInvestRatio?: number;
  strategies: string[];
  startDate: string;
  endDate: string;
  sellProfitPercentage?: number;
  buybackDropPercentage?: number;
}) {
  // 将strategies数组转换为逗号分隔的字符串
  const { strategies, ...otherParams } = params;
  const strategiesStr = strategies.join(',');
  
  return request('/api/backtest/run', {
    method: 'GET',
    params: {
      ...otherParams,
      strategies: strategiesStr,
    },
  });
}

/** 执行参数优化回测 GET /api/backtest/optimize */
export async function optimizeBacktest(params: {
  stockCode: string;
  indexCode?: string;
  initialCapital?: number;
  investAmount?: number;
  maxInvestRatio?: number;
  strategies: string[];
  startDate: string;
  endDate: string;
  sellProfitRangeStart?: number;
  sellProfitRangeEnd?: number;
  sellProfitStep?: number;
  buybackRangeStart?: number;
  buybackRangeEnd?: number;
  buybackStep?: number;
}) {
  // 将strategies数组转换为逗号分隔的字符串
  const { strategies, ...otherParams } = params;
  const strategiesStr = strategies.join(',');
  
  return request('/api/backtest/optimize', {
    method: 'GET',
    params: {
      ...otherParams,
      strategies: strategiesStr,
    },
  });
}

/** 比较不同策略 GET /api/backtest/compare */
export async function compareBacktestStrategies(params: {
  stockCode: string;
  indexCode?: string;
  initialCapital?: number;
}) {
  return request('/api/backtest/compare', {
    method: 'GET',
    params,
  });
}

// 启动OpenD
export async function startOpenD(params: {
  account: string;
}) {
  return request<API.ApiResponse>('/api/accountInfo/startOpenD', {
    method: 'POST',
    data: params,
  });
}

/** 生成账户配置文件 POST /api/accountInfo/generateConfig */
export async function generateAccountConfig(params: {
  account: string;
}) {
  return request<API.ApiResponse>('/api/accountInfo/generateConfig', {
    method: 'POST',
    data: params,
  });
}

/** 运行实时策略回归测试 */
export async function runRealtimeRegression(
  stockCode: string,
  sellProfitPercentage: number,
  options?: { [key: string]: any },
) {
  return request<any>('/api/backtest/realtime-regression', {
    method: 'GET',
    params: {
      stockCode,
      sellProfitPercentage,
    },
    ...(options || {}),
  });
}

/** 执行市值筛选回归测试 POST /api/backtest/market-cap-regression */
export async function runMarketCapRegression(
  marketCap: number,
  sellProfitPercentage: number,
  options?: { [key: string]: any }
) {
  return request<API.Response<API.RegressionResult>>('/api/backtest/market-cap-regression', {
    method: 'GET',
    params: {
      marketCap,
      sellProfitPercentage,
    },
    ...(options || {}),
  });
}

// 批量创建定投（多账户）
export async function batchCreateDingtou(params: Record<string, any>) {
  return request('/api/dingtou/batch', {
    method: 'POST',
    data: params,
  });
}

// 获取定时订单列表
export async function listScheduledOrders(
  params: {
    current?: number;
    pageSize?: number;
    accounts?: string;
    code?: string;
    status?: number;
    trdSide?: number;
    startTime?: string;
    endTime?: string;
    timezone?: string;
  },
  sort?: Record<string, string>,
  options?: { [key: string]: any },
) {
  try {
    const response = await request('/api/scheduledOrder/list', {
      method: 'GET',
      params: {
        ...params,
        sortKey: sort ? Object.keys(sort)[0] : '',
        sortOrder: sort ? Object.values(sort)[0] : '',
      },
      ...(options || {}),
    });
    
    // 调试输出
    console.log('定时订单API原始返回:', response);
    
    // 确保返回符合表格预期的数据结构
    if (!response.data && response.records) {
      response.data = response.records;
    }
    
    // 如果 data 不是数组，尝试修复
    if (response.data && !Array.isArray(response.data)) {
      if (Array.isArray(response.data.records)) {
        response.data = response.data.records;
      } else {
        console.error('定时订单API返回的数据结构异常:', response.data);
        response.data = [];
      }
    }
    
    return response;
  } catch (error) {
    console.error('获取定时订单列表异常:', error);
    return { success: false, data: [] };
  }
}

// 创建定时订单
export async function createScheduledOrder(data: Record<string, any>) {
  return request('/api/scheduledOrder', {
    method: 'POST',
    data,
  });
}

// 批量创建定时订单
export async function batchCreateScheduledOrders(data: Record<string, any>) {
  console.log('批量创建定时订单 - 参数:', JSON.stringify(data, null, 2));
  
  // 确保参数格式正确
  const formattedData = {
    ...data,
    // 确保accountList存在
    accountList: Array.isArray(data.accountList) ? data.accountList : [],
    // 确保数值类型正确
    number: typeof data.number === 'number' ? data.number : parseInt(data.number),
    price: data.price !== null && data.price !== undefined ? 
      (typeof data.price === 'number' ? data.price : parseFloat(data.price)) : 
      null,
    sellTriggerValue: data.sellTriggerValue !== null && data.sellTriggerValue !== undefined ? 
      (typeof data.sellTriggerValue === 'number' ? data.sellTriggerValue : parseFloat(data.sellTriggerValue)) : 
      null,
    // 确保字段名正确
    accountAliases: data.accountAliases || (Array.isArray(data.accountList) && data.accountList.length > 0 ? 
      `批量下单(${data.accountList.length}个账号)` : '未命名账号'),
    // 确保scheduledTime是字符串格式
    scheduledTime: typeof data.scheduledTime === 'string' ? 
      data.scheduledTime : 
      (data.scheduledTime && data.scheduledTime.format ? 
        data.scheduledTime.format('YYYY-MM-DD HH:mm:ss') : 
        data.scheduledTime)
  };
  
  console.log('格式化后的请求参数:', JSON.stringify(formattedData, null, 2));
  
  try {
    const response = await request<API.Response<any>>('/api/scheduledOrder/batch', {
      method: 'POST',
      data: formattedData,
      errorHandler: (error: any) => {
        console.error('批量创建定时订单API错误:', error);
        const errorResponse = error.response?.data || {};
        return { 
          success: false, 
          errorMessage: errorResponse.message || error.message || '请求失败' 
        };
      }
    });
    
    console.log('批量创建定时订单 - 响应:', response);
    return response;
  } catch (error: any) {
    console.error('批量创建定时订单 - 捕获到异常:', error);
    throw error;
  }
}

// 取消定时订单
export async function cancelScheduledOrder(id: number) {
  return request(`/api/scheduledOrder/cancel/${id}`, {
    method: 'POST',
  });
}

// 批量取消定时订单
export async function batchCancelScheduledOrders(ids: number[]) {
  return request('/api/scheduledOrder/batchCancel', {
    method: 'POST',
    params: {
      ids: ids.join(','),
    },
  });
}

// 立即执行定时订单
export async function executeScheduledOrder(id: number) {
  return request(`/api/scheduledOrder/execute/${id}`, {
    method: 'POST',
  });
}

// 获取支持的时区列表，修改为返回固定的两个时区
export async function getTimezones() {
  // 固定返回两个时区
  return {
    success: true,
    data: ['America/New_York', 'Asia/Shanghai']
  };
}

// 更新定时订单
export async function updateScheduledOrder(id: number, data: Record<string, any>) {
  return request(`/api/scheduledOrder/${id}`, {
    method: 'PUT',
    data,
  });
}

/** 获取策略任务列表 GET /api/strategyJob/list */
export async function listStrategyJob(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    name?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.StrategyJobList>('/api/strategy/job/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建策略任务 POST /api/strategyJob/create */
export async function createStrategyJob(body: API.StrategyJobItem, options?: { [key: string]: any }) {
  return request<API.Response<void>>('/api/strategy/job', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新策略任务 POST /api/strategyJob/update */
export async function updateStrategyJob(body: API.StrategyJobItem, options?: { [key: string]: any }) {
  console.log('更新策略任务参数:', body); // 添加日志输出查看传递的参数
  try {
    const response = await request<API.Response<void>>('/api/strategy/job', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      data: body,
      ...(options || {}),
    });
    console.log('更新策略任务响应:', response);
    return response;
  } catch (error) {
    console.error('更新策略任务错误:', error);
    throw error;
  }
}

/** 删除策略任务 POST /api/strategyJob/delete */
export async function deleteStrategyJob(body: API.StrategyJobItem, options?: { [key: string]: any }) {
  return request<API.Response<void>>(`/api/strategy/job/${body.id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** 获取策略用户股票关系列表 GET /api/strategy/user-stock/page */
export async function listStrategyUserStock(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
    strategyId?: number;
    account?: string;
    stockCode?: string;
    status?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.StrategyUserStockList>('/api/strategy/user-stock/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建策略用户股票关系 POST /api/strategy/user-stock */
export async function createStrategyUserStock(body: API.StrategyUserStockItem, options?: { [key: string]: any }) {
  return request<API.Response<void>>('/api/strategy/user-stock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 批量创建策略用户股票关系 POST /api/strategy/user-stock/batch */
export async function batchCreateStrategyUserStock(body: API.BatchCreateStrategyUserStockRequest, options?: { [key: string]: any }) {
  return request<API.Response<API.BatchCreateStrategyUserStockResult>>('/api/strategy/user-stock/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新策略用户股票关系 PUT /api/strategy/user-stock */
export async function updateStrategyUserStock(body: API.StrategyUserStockItem, options?: { [key: string]: any }) {
  return request<API.Response<void>>('/api/strategy/user-stock', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除策略用户股票关系 DELETE /api/strategy/user-stock/{id} */
export async function deleteStrategyUserStock(body: API.StrategyUserStockItem, options?: { [key: string]: any }) {
  return request<API.Response<void>>(`/api/strategy/user-stock/${body.id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** 获取策略股票在各账户中的配置状态 GET /api/strategy/user-stock/account-config-status/{strategyId}/{stockCode} */
export async function getAccountConfigStatus(
  params: {
    strategyId: number;
    stockCode: string;
  },
  options?: { [key: string]: any },
): Promise<API.Response<API.AccountConfigStatusVO[]>> {
  return request<API.Response<API.AccountConfigStatusVO[]>>(
    `/api/strategy/user-stock/account-config-status/${params.strategyId}/${params.stockCode}`,
    {
      method: 'GET',
      ...(options || {}),
    },
  );
}

/** 更新策略用户股票关系二阶段策略状态 POST /api/strategy/user-stock/second-stage */
export async function updateStrategyUserStockSecondStage(params: { id: number; enabled: boolean }) {
  return request<API.Response<any>>('/api/strategy/user-stock/second-stage', {
    method: 'POST',
    data: params,
  });
}

// 获取账户列表 (简易版，用于下拉选择)
export async function listAccount(params?: { [key: string]: any }) {
  try {
    const response = await request<API.Response<API.AccountInfo[]>>('/api/accountInfo/list', {
      method: 'GET',
      params,
    });
    
    if (response && response.data) {
      // 转换为下拉选择器所需的格式
      return {
        success: true,
        data: response.data.map((item: any) => ({
          account: item.account,
          name: item.name,
          id: item.id
        }))
      };
    }
    
    return { success: false, data: [] };
  } catch (error) {
    console.error('获取账户列表出错:', error);
    return { success: false, data: [] };
  }
}

/**
 * 执行策略回归测试
 * @param stockCode 股票代码
 * @param strategyId 策略ID
 * @param strategyClassName 策略类名
 * @param sellProfitPercentage 卖出盈利百分比
 * @param dayCount 回测天数
 * @param initialFunds 初始资金
 * @param options 配置项
 * @returns 回归测试结果
 */
export async function runStrategyRegression(
  stockCode: string,
  strategyId?: number,
  strategyClassName?: string,
  sellProfitPercentage: number = 1.5,
  dayCount: number = 10,
  initialFunds: number = 100000,
  options?: { [key: string]: any }
) {
  return request<API.Response<any>>('/api/strategy/regression/run', {
    method: 'GET',
    params: {
      stockCode,
      strategyId,
      strategyClassName,
      sellProfitPercentage,
      dayCount,
      initialFunds
    },
    ...(options || {}),
  });
}

/**
 * 根据策略ID执行回归测试
 * @param strategyId 策略ID
 * @param sellProfitPercentage 卖出盈利百分比
 * @param dayCount 回测天数
 * @param initialFunds 初始资金
 * @param options 配置项
 * @returns 回归测试结果
 */
export async function runRegressionByStrategy(
  strategyId: number,
  sellProfitPercentage: number = 1.5,
  dayCount: number = 10,
  initialFunds: number = 100000,
  options?: { [key: string]: any }
) {
  return request<API.Response<any>>('/api/strategy/regression/run-by-strategy', {
    method: 'GET',
    params: {
      strategyId,
      sellProfitPercentage,
      dayCount,
      initialFunds
    },
    ...(options || {}),
  });
}

/**
 * 手动执行策略任务
 * @param id 策略任务ID
 * @returns 执行结果
 */
export async function executeStrategyJob(id: number) {
  return request<API.Response<void>>(`/api/strategy/job/execute/${id}`, {
    method: 'POST',
  });
}

/** 切换策略任务档位 POST /api/strategy/job/switch-template-level/{id} */
export async function switchStrategyJobTemplateLevel(id: number, templateLevel: string) {
  return request<API.Response<API.TemplateLevelApplyResult>>(`/api/strategy/job/switch-template-level/${id}`, {
    method: 'POST',
    data: { templateLevel },
  });
}

/** 批量切换策略标的档位 POST /api/strategy/stock/batch-switch-template-level */
export async function batchSwitchStrategyStockTemplateLevel(params: {
  ids: number[];
  templateLevel: string;
}) {
  return request<API.Response<API.TemplateLevelApplyResult>>('/api/strategy/stock/batch-switch-template-level', {
    method: 'POST',
    data: params,
  });
}

/**
 * 获取股票分时数据
 * @param stockCode 股票代码
 * @param days 天数，默认5
 */
export async function getStockMinuteData(
  stockCode: string, 
  days?: number,
  strategyId?: number,
  account?: string
) {
  // 添加日志输出，打印返回的数据
  const response = await request<API.Response<API.StockMinuteVO>>('/api/stock-minute/data', {
    method: 'GET',
    params: {
      stockCode,
      days,
      strategyId,
      account
    },
  });
  
  // 检查买卖点数据是否包含账户名和额外信息
  if (response.success && response.data) {
    console.log('买入点数据示例:', response.data.buyPoints?.[0]);
    console.log('卖出点数据示例:', response.data.sellPoints?.[0]);
  }
  
  return response;
}

export async function updateStrategyStockStatus(
  params: {
    id: number;
    status: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>(`/api/strategy/stock/status/${params.id}/${params.status}`, {
    method: 'POST',
    ...(options || {}),
  });
}

export async function updateStrategyStockOpeningBuy(
  params: {
    id: number;
    enableOpeningBuy: boolean;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>(`/api/strategy/stock/opening-buy/${params.id}`, {
    method: 'POST',
    data: {
      enableOpeningBuy: params.enableOpeningBuy,
    },
    ...(options || {}),
  });
}

/** 更新策略股票关系收盘前盈利卖出状态 POST /api/strategy/stock/profit-sell-before-close/{id} */
export async function updateStrategyStockProfitSellBeforeClose(
  params: {
    id: number;
    enableProfitSellBeforeClose: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>(`/api/strategy/stock/profit-sell-before-close/${params.id}`, {
    method: 'POST',
    data: {
      enableProfitSellBeforeClose: params.enableProfitSellBeforeClose,
    },
    ...(options || {}),
  });
}

/** 批量更新策略股票关系收盘前盈利卖出状态 POST /api/strategy/stock/batch-profit-sell-before-close */
export async function batchUpdateStrategyStockProfitSellBeforeClose(
  params: {
    ids: number[];
    enableProfitSellBeforeClose: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/stock/batch-profit-sell-before-close', {
    method: 'POST',
    data: {
      ids: params.ids,
      enableProfitSellBeforeClose: params.enableProfitSellBeforeClose,
    },
    ...(options || {}),
  });
}

export async function batchUpdateStrategyStockOpeningBuy(
  params: {
    ids: number[];
    enableOpeningBuy: boolean;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/stock/batch-opening-buy', {
    method: 'POST',
    data: {
      ids: params.ids,
      enableOpeningBuy: params.enableOpeningBuy,
    },
    ...(options || {}),
  });
}

export async function updateStrategyUserStockStatus(
  params: {
    id: number;
    status: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>(`/api/strategy/user-stock/status/${params.id}/${params.status}`, {
    method: 'POST',
    ...(options || {}),
  });
}

export async function updateStrategyUserStockOpeningBuy(
  params: {
    id: number;
    enableOpeningBuy: boolean | null;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>(`/api/strategy/user-stock/opening-buy/${params.id}`, {
    method: 'POST',
    data: {
      enableOpeningBuy: params.enableOpeningBuy,
    },
    ...(options || {}),
  });
}

export async function batchUpdateStrategyUserStockOpeningBuy(
  params: {
    ids: number[];
    enableOpeningBuy: boolean | null;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/user-stock/batch-opening-buy', {
    method: 'POST',
    data: {
      ids: params.ids,
      enableOpeningBuy: params.enableOpeningBuy,
    },
    ...(options || {}),
  });
}

/** 获取策略统计数据 GET /api/strategy-statistics/data */
export async function getStrategyStatisticsData(params: {
  strategyId?: number;
  account?: string;
  stockCode?: string;
  startDate?: string;
  endDate?: string;
}) {
  return request<API.Response<any>>('/api/strategy-statistics/data', {
    method: 'GET',
    params: {
      ...params,
    },
  });
}

// 策略配置模版相关接口
export async function saveConfigTemplate(params: API.StrategyConfigTemplateItem) {
  return request<API.Response<number>>('/api/strategy-config-template/save', {
    method: 'POST',
    data: params,
  });
}

export async function applyConfigTemplate(params: API.StrategyConfigTemplateItem) {
  return request<API.Response<boolean>>('/api/strategy-config-template/apply', {
    method: 'POST',
    data: params,
  });
}

export async function getConfigTemplateList(params?: {
  configType?: 'user_stock' | 'strategy_stock';
}) {
  return request<API.Response<API.StrategyConfigTemplateItem[]>>('/api/strategy-config-template/list', {
    method: 'GET',
    params,
  });
}

export async function deleteConfigTemplate(id: number) {
  return request<API.Response<boolean>>(`/api/strategy-config-template/${id}`, {
    method: 'DELETE',
  });
}

export async function updateConfigTemplate(id: number, params: API.StrategyConfigTemplateItem) {
  return request<API.Response<boolean>>(`/api/strategy-config-template/${id}`, {
    method: 'PUT',
    data: params,
  });
}

export async function getConfigTemplateById(id: number) {
  return request<API.Response<API.StrategyConfigTemplateItem>>(`/api/strategy-config-template/${id}`, {
    method: 'GET',
  });
}

export async function batchUpdateStrategyStockStatus(
  params: {
    ids: number[];
    status: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/stock/batch-status', {
    method: 'POST',
    data: {
      ids: params.ids,
      status: params.status,
    },
    ...(options || {}),
  });
}

export async function batchUpdateStrategyUserStockStatus(
  params: {
    ids: number[];
    status: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/user-stock/batch-status', {
    method: 'POST',
    data: {
      ids: params.ids,
      status: params.status,
    },
    ...(options || {}),
  });
}

export async function batchUpdateStrategyUserStockProfitRatio(
  params: {
    ids: number[];
    profitRatio: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/user-stock/batch-profit-ratio', {
    method: 'POST',
    data: {
      ids: params.ids,
      profitRatio: params.profitRatio,
    },
    ...(options || {}),
  });
}

export async function batchUpdateStrategyUserStockTime(
  params: {
    ids: number[];
    startTime?: string;
    endTime?: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/user-stock/batch-time', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

/** 批量更新策略用户股票关系的未卖出堆栈值 */
export async function batchUpdateStrategyUserStockUnsoldStackLimit(
  params: {
    ids: number[];
    unsoldStackLimit: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/user-stock/batch-unsold-stack-limit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

/** 批量更新策略用户股票关系的限制开始份数 */
export async function batchUpdateStrategyUserStockLimitStartShares(
  params: {
    ids: number[];
    limitStartShares: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/user-stock/batch-limit-start-shares', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

/** 批量更新策略用户股票关系的最大持有买入单数 */
export async function batchUpdateStrategyUserStockTotalFundShares(
  params: {
    ids: number[];
    totalFundShares: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.ApiResponse>('/api/strategy/user-stock/batch-total-fund-shares', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

/** 更新策略用户股票关系的时段分时配置 */
export async function updateStrategyUserStockTimeSegmentConfig(
  params: {
    id: number;
    timeSegmentMaConfig: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.Response<void>>('/api/strategy/user-stock/time-segment-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

/** 批量更新策略用户股票关系的时段分时配置 */
export async function batchUpdateStrategyUserStockTimeSegmentConfig(
  params: {
    ids: number[];
    timeSegmentMaConfig: string;
    stockCode: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.Response<void>>('/api/strategy/user-stock/batch-time-segment-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

export async function batchUpdateStrategyStockTimeSegmentConfig(
  params: {
    ids: number[];
    timeSegmentMaConfig: string;
  },
  options?: { [key: string]: any },
) {
  return request<API.Response<void>>('/api/strategy/stock/batch-time-segment-config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: params,
    ...(options || {}),
  });
}

// 时段档位配置模版相关接口
export async function createTimeSegmentTemplate(params: API.TimeSegmentTemplateItem, forceOverwrite?: boolean) {
  return request<API.Response<boolean>>('/api/timeSegmentTemplate/create', {
    method: 'POST',
    data: params,
    params: forceOverwrite ? { forceOverwrite: true } : undefined,
  });
}

export async function updateTimeSegmentTemplate(params: API.TimeSegmentTemplateItem) {
  return request<API.Response<boolean>>('/api/timeSegmentTemplate/update', {
    method: 'PUT',
    data: params,
  });
}

export async function deleteTimeSegmentTemplate(id: number) {
  return request<API.Response<boolean>>(`/api/timeSegmentTemplate/delete/${id}`, {
    method: 'DELETE',
  });
}

export async function getTimeSegmentTemplateById(id: number) {
  return request<API.Response<API.TimeSegmentTemplateItem>>(`/api/timeSegmentTemplate/get/${id}`, {
    method: 'GET',
  });
}

export async function listTimeSegmentTemplates(params?: {
  current?: number;
  pageSize?: number;
  templateName?: string;
  templateLevel?: string;
  configType?: string;
  strategyId?: number;
  stockCode?: string;
  account?: string;
}) {
  return request<API.Response<{ records: API.TimeSegmentTemplateItem[]; total: number }>>('/api/timeSegmentTemplate/list', {
    method: 'GET',
    params,
  });
}

export async function getTimeSegmentTemplateLevels() {
  return request<API.Response<{ value: string; label: string }[]>>('/api/timeSegmentTemplate/templateLevels', {
    method: 'GET',
  });
}

export async function listTimeSegmentTemplatesByLevel(params: {
  templateLevel: string;
  strategyId?: number;
  stockCode?: string;
  configType?: string;
}) {
  return request<API.Response<API.TimeSegmentTemplateItem[]>>('/api/timeSegmentTemplate/listByLevel', {
    method: 'GET',
    params,
  });
}

export async function applyTimeSegmentTemplateToStrategyStock(params: {
  templateId: number;
  strategyStockIds: number[];
}) {
  return request<API.Response<boolean>>('/api/timeSegmentTemplate/applyToStrategyStock', {
    method: 'POST',
    data: params,
  });
}

export async function applyTimeSegmentTemplateToUserStock(params: {
  templateId: number;
  userStockIds: number[];
}) {
  return request<API.Response<boolean>>('/api/timeSegmentTemplate/applyToUserStock', {
    method: 'POST',
    data: params,
  });
}