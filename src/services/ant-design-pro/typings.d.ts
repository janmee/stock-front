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
    accId?: string;  // 资金账户ID
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
    connected?: boolean;  // 连接状态
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
    total?: number;
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
    intraUpPullbackPercent?: number;
    intraDnBelowAvgPercent?: number;
    intraDnDurationMinutes?: number;
    intraUpDurationMinutes?: number;
    unsoldStackLimit?: number;
    totalFundShares?: number;
    limitStartShares?: number;
    status?: string;
    createTime?: string;
    updateTime?: string;
    buyRatioConfig?: string;
    enableOpeningBuy?: boolean; // 是否启用开盘买入
    configTemplateId?: number; // 策略配置模版ID
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
    secondStageEnabled?: boolean; // 是否启动二阶段策略
    secondStageStartDate?: string; // 启动二阶段策略日期，格式yyyy-MM-dd
    cooldownTime?: number; // 相邻买入冷却时间（分钟）
    unsoldStackLimit?: number; // 未卖出堆栈值
    totalFundShares?: number; // 总资金份数
    limitStartShares?: number; // 限制开始份数
    profitRatio?: number; // 盈利比例
    enableOpeningBuy?: boolean; // 是否启用开盘买入
    configTemplateId?: number; // 策略配置模版ID
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

  // 策略统计数据类型
  type StrategyStatisticsVO = {
    strategyId?: number;
    strategyName?: string;
    account?: string;
    stockCode?: string;
    buyOrderCount: number;
    sellOrderCount: number;
    profitOrderCount: number;
    totalProfit: number;
    totalProfitPercentage: number;
    unfinishedOrderCount: number;
    totalUnfinishedAmount: number;
    averageBuyAmount: number;
    currentMarketValue: number;
    unrealizedProfitLoss: number;
    unrealizedProfitLossPercentage: number;
    qqqGainPercentage: number;
    stockGainPercentage: number;
    gainStartTime?: string;
    gainEndTime?: string;
    startTime?: string;
    endTime?: string;
    buyOrders: any[];
    sellOrders: any[];
    stockStatistics?: Record<string, StrategyStatisticsVO>;
  };

  type StrategyConfigTemplateItem = {
    id?: number;
    name?: string;
    applicableScenario?: string;
    strategyId?: number;
    sourceStockCode?: string;
    minMarketCap?: number;
    maxMarketCap?: number;
    configType?: 'user_stock' | 'strategy_stock';
    configTypeDesc?: string;
    marketCondition?: string; // 行情类型（震荡、高开高走、高开低走、低开高走、低开低走）
    volatilityRange?: string; // 波动范围，用户自定义字符串
    configJson?: string;
    createTime?: string;
    updateTime?: string;
    // 以下字段用于接口传参，不存储到数据库
    sourceId?: number; // 源配置ID（用于保存模版时获取配置数据）
    targetIds?: number[]; // 目标配置ID列表（用于应用模版时的批量操作）
    overwrite?: boolean; // 是否覆盖现有配置（用于应用模版时）
  };

  type StrategyConfigTemplateList = {
    data?: StrategyConfigTemplateItem[];
    /** 列表的内容总数 */
    total?: number;
    success?: boolean;
  };
}
