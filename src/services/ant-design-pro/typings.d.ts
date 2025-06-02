// @ts-ignore
/* eslint-disable */

declare namespace API {
  type CurrentUser = {
    name?: string;
    avatar?: string;
    userid?: string;
    email?: string;
    signature?: string;
    title?: string;
    group?: string;
    tags?: { key?: string; label?: string }[];
    notifyCount?: number;
    unreadCount?: number;
    country?: string;
    access?: string;
    geographic?: {
      province?: { label?: string; key?: string };
      city?: { label?: string; key?: string };
    };
    address?: string;
    phone?: string;
  };

  type LoginResult = {
    errorMessage: string;
    success: boolean;
    data: any;
    status?: string;
    type?: string;
    currentAuthority?: string;
  };

  type PageParams = {
    current?: number;
    pageSize?: number;
  };

  type RuleListItem = {
    selected: string;
    className: any;
    running: string;
    minRate: any;
    maxRate: any;
    minPrice: any;
    maxPrice: any;
    increaseRateList: Record<string, any>[];
    pricesList: Record<string, any>[];
    prices: any[];
    dailyIncomeRate: {};
    rateOrder: [];
    dailyRateList: any[];
    success: any;
    status: any;
    data: any;
    name: string,
    accountAmount: number,
    accountDate: string,
    buyAmount: number,
    buyDate: string,
    code: string,
    createTime: string,
    expectedIncome: number,
    expectedIncomeRate: number,
    id: number,
    realIncome: number,
    realIncomeRate: number,
    saleAmount: number,
    saleDate: string,
    updateTime: string,
    key?: number;
    // disabled?: boolean;
    // href?: string;
    // avatar?: string;
    // name?: string;
    // owner?: string;
    desc?: string;
    callNo?: number;
    // status?: number;
    // updatedAt?: string;
    // createdAt?: string;
    // progress?: number;
  };

  type RuleList = {
    data?: RuleListItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type FakeCaptcha = {
    code?: number;
    status?: string;
  };

  type LoginParams = {
    username?: string;
    password?: string;
    autoLogin?: boolean;
    type?: string;
  };

  type ErrorResponse = {
    /** 业务约定的错误码 */
    errorCode: string;
    /** 业务上的错误信息 */
    errorMessage?: string;
    /** 业务上的请求是否成功 */
    success?: boolean;
  };

  type NoticeIconList = {
    data?: NoticeIconItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type NoticeIconItemType = 'notification' | 'message' | 'event';

  type NoticeIconItem = {
    id?: string;
    extra?: string;
    key?: string;
    read?: boolean;
    avatar?: string;
    title?: string;
    status?: string;
    datetime?: string;
    description?: string;
    type?: NoticeIconItemType;
  };

  type AccountInfo = {
    id: number;
    account: string;
    name: string;
    host: string;
    port: number;
    tradePassword?: string;
    availableAmount: number;
    totalAmount: number;
    power: number;
    master: boolean;
    follow?: string;
    enable: boolean;
    createTime: string;
    updateTime: string;
    marketVal: number;  // 证券市值
    riskLevel: number;  // 风险等级
    overPercent: number;  // 最大使用资金占总资产百分比
    initAmount: number;   // 初始资金
  };

  interface PositionObj {
    code: string;
    qty: number;
    canSellQty: number;
    costPrice: number;
    price: number;
    val: number;
    plRatio: number;
    positionSide: number;
  }

  type Response<T> = {
    success: boolean;
    data: T;
    errorCode?: string;
    errorMessage?: string;
    message?: string;
  };

  type RegressionResult = {
    /** 回归测试结果 */
    result: string;
    /** 回归测试详情 */
    details: string;
  };

  // 定时订单类型
  type ScheduledOrder = {
    id: number;
    accounts: string;
    accountAliases?: string;
    code: string;
    trdSide: number;
    orderType: number;
    price?: number;
    number: number;
    scheduledTime: string;
    timezone: string;
    status: number;
    execResults?: string;
    errorMessage?: string;
    timeForce?: number;
    sellTriggerType?: string;
    sellTriggerValue?: number;
    createdBy?: string;
    createTime: string;
    updateTime: string;
  };
  
  // 账号执行结果类型
  type AccountExecutionResult = {
    [account: string]: string;
  };

  type StrategyJobItem = {
    id?: number;
    name?: string;
    description?: string;
    className?: string;
    cron?: string;
    timeZone?: string;
    endTime?: string;
    status?: string;
    running?: string;
    deleted?: string;
    extra?: string;
    createTime?: string;
    updateTime?: string;
  };

  type StrategyJobList = {
    data?: StrategyJobItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type StrategyStockItem = {
    id?: number;
    strategyId?: number;
    strategyName?: string;
    stockCode?: string;
    profitRatio?: number;
    maBelowPercent?: number;
    maAbovePercent?: number;
    levelPercent?: number;
    unsoldStackLimit?: number;
    totalFundShares?: number;
    limitStartShares?: number;
    status?: string;
    createTime?: string;
    updateTime?: string;
    buyRatioConfig?: string;
  };

  type StrategyStockList = {
    data?: StrategyStockItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type StrategyUserStockItem = {
    id?: number;
    strategyId?: number;
    strategyName?: string;
    account?: string;
    accountName?: string;
    stockCode?: string;
    fundPercent?: number;
    maxAmount?: number;
    dailyCompletedOrders?: number;
    startTime?: string;
    endTime?: string;
    timeZone?: string;
    status?: string;
    createTime?: string;
    updateTime?: string;
  };

  type StrategyUserStockList = {
    data?: StrategyUserStockItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type AccountList = {
    data?: AccountInfo[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };

  type StockMinuteData = {
    current: number;
    volume: number;
    avgPrice: number;
    high: number;
    low: number;
    timestamp: number;
    percent: number;
  };

  type StockMinuteVO = {
    stockCode: string;
    minuteData: StockMinuteData[];
    buyPoints: {
      time: string;
      price: number;
      orderNo: string;
      number?: number;
      fillQty?: number;
      accountName?: string;
      extra?: string;
    }[];
    sellPoints: {
      time: string;
      price: number;
      orderNo: string;
      number?: number;
      fillQty?: number;
      accountName?: string;
      extra?: string;
    }[];
    profitStatistics?: {
      profitOrderCount: number;
      totalBuyAmount: number;
      totalSellAmount: number;
      totalProfit: number;
      totalProfitPercentage: number;
    };
    unfinishedProfitStatistics?: {
      unfinishedOrderCount: number;
      totalUnfinishedAmount: number;
    };
  };
}
