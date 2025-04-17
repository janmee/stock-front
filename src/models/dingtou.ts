export interface Dingtou {
  id?: number;
  account: string;
  code: string;
  startTime: string;
  lastTime?: string;
  alreadyTimes?: number;
  allTimes: number;
  rate: number;
  amount: number;
  enable: boolean;
  createTime?: string;
  updateTime?: string;
  sellPercentage: number;  // 盈利百分比卖出，0为不卖出
  buyAfterSellPercentage: number;  // 卖出后，下跌多少百分比后，再次买入，0为不买入
  buyOnIndexDown: boolean;  // 是否在大盘下跌时买入
}

export interface DingtouQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
}