export interface Dingtou {
  id?: number;
  account: string;
  accountAlias?: string;
  code: string;
  startTime?: Date;
  lastTime?: Date;
  alreadyTimes?: number;
  allTimes?: number;
  rate?: number;
  amount?: number;
  enable?: boolean;
  sellPercentage?: number;
  buyAfterSellPercentage?: number;
  weekDay?: number;
  weekInterval?: number;
  buyOnIndexDown?: boolean;
  createTime?: Date;
  updateTime?: Date;
}

export interface DingtouQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
}