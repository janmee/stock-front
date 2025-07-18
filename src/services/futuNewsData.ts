import { request } from '@umijs/max';

export interface FutuNewsDataItem {
  id: string;
  time: string;
  content: string;
  title: string;
  detailUrl: string;
  newsType: number;
  level: number;
  targetUrlQuery: string;
  relatedStocks: string;
  stockCode: string;
  market: string;
  stockMarketCap: string;
  stockName: string;
  price: string;
  changeRatio: string;
  pmahPrice: string;
  pmahChangeRatio: string;
  quoteInfo: string;
  createTime: string;
  updateTime: string;
}

export interface FutuNewsDataQuery {
  current?: number;
  pageSize?: number;
  newsType?: number;
  level?: number;
  keyword?: string;
  startTime?: string;
  endTime?: string;
  stockCode?: string;
  hasStockInfo?: boolean;
  market?: string; // 市场筛选：US(美股)、HK(港股)、SH(A股)
  maxTime?: string;
}

export interface FutuNewsDataResponse {
  success: boolean;
  data: FutuNewsDataItem[];
  errorMessage?: string;
}

/**
 * 获取富途快讯数据列表
 */
export async function getFutuNewsDataList(params: FutuNewsDataQuery): Promise<FutuNewsDataResponse> {
  return request('/api/futuNewsData/list', {
    method: 'POST',
    data: params,
  });
}

/**
 * 刷新富途快讯数据
 */
export async function refreshFutuNewsData(pageSize?: number): Promise<FutuNewsDataResponse> {
  try {
    const response = await fetch('/api/futuNewsData/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ...(pageSize && { pageSize: pageSize.toString() }),
      }),
    });
    return await response.json();
  } catch (error) {
    console.error('刷新富途快讯数据失败:', error);
    return { success: false, data: [], errorMessage: '刷新数据失败' };
  }
}

/**
 * 获取最新富途快讯数据
 */
export async function getLatestFutuNewsData(limit?: number): Promise<FutuNewsDataResponse> {
  return request('/api/futuNewsData/latest', {
    method: 'GET',
    params: { limit },
  });
}

/**
 * 根据ID获取富途快讯数据详情
 */
export async function getFutuNewsDataById(id: string): Promise<FutuNewsDataResponse> {
  return request(`/api/futuNewsData/${id}`, {
    method: 'GET',
  });
} 