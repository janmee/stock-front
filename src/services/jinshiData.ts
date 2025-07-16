import { request } from '@umijs/max';

export interface JinshiDataItem {
  id: string;
  time: string;
  type: number;
  title?: string;
  content: string;
  pic?: string;
  important: number;
  tags?: string;
  channel?: string;
  remark?: string;
  vipTitle?: string;
  isLock?: boolean;
  vipLevel?: number;
  vipDesc?: string;
  link?: string;
  tag?: string;
  createTime?: string;
  updateTime?: string;
}

export interface JinshiDataQuery {
  current?: number;
  pageSize?: number;
  channel?: string;
  vipLevel?: number;
  maxTime?: string;
  type?: number;
  important?: number;
  keyword?: string;
  startTime?: string;
  endTime?: string;
}

export interface JinshiDataResponse {
  data: JinshiDataItem[];
  success: boolean;
  errorCode?: number;
  errorMessage?: string;
  total?: number;
}

/**
 * 获取金时数据列表
 */
export async function getJinshiDataList(params: JinshiDataQuery): Promise<JinshiDataResponse> {
  return request('/api/jinshiData/list', {
    method: 'POST',
    data: params,
  });
}

/**
 * 手动刷新金时数据
 */
export async function refreshJinshiData(params?: {
  channel?: string;
  vipLevel?: number;
  maxTime?: string;
}): Promise<JinshiDataResponse> {
  return request('/api/jinshiData/refresh', {
    method: 'POST',
    params,
  });
}

/**
 * 获取最新数据
 */
export async function getLatestJinshiData(limit?: number): Promise<JinshiDataResponse> {
  return request('/api/jinshiData/latest', {
    method: 'GET',
    params: { limit },
  });
}

/**
 * 根据ID获取详情
 */
export async function getJinshiDataById(id: string): Promise<{
  data: JinshiDataItem;
  success: boolean;
  errorCode?: number;
  errorMessage?: string;
}> {
  return request(`/api/jinshiData/${id}`, {
    method: 'GET',
  });
} 