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
}

export interface DingtouQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
}