import { request } from 'umi';

const API_PREFIX = '/api/immediate-buy-record';

export interface ImmediateBuyRecord {
  id: number;
  strategyId: number;
  strategyName: string;
  stockCode: string;
  account: string;
  accountName: string;
  buyType: string;
  fundPercent: number;
  fixedAmount: number;
  profitRatio: number;
  buyReason: string;
  stockPrice: number;
  buyQuantity: number;
  buyAmount: number;
  orderId: string;
  orderNo: string;
  orderStatus: number;
  orderStatusName: string;
  canCancel: boolean;
  fillQty: number;
  fillAvgPrice: number;
  fillAmount: number;
  buyStatus: string;
  failureReason: string;
  extraInfo: string;
  createTime: string;
  updateTime: string;
}

export interface QueryParams {
  current?: number;
  pageSize?: number;
  strategyId?: number;
  strategyName?: string;
  stockCode?: string;
  account?: string;
  accountName?: string;
  buyType?: string;
  buyStatus?: string;
  startDate?: string;
  endDate?: string;
  sortKey?: string;
  sortOrder?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
  code?: number;
}

export interface BatchCancelOrderResult {
  totalCount: number;
  successCount: number;
  failureCount: number;
  successDetails: string[];
  failureDetails: string[];
}

export const immediateBuyRecordService = {
  /**
   * 分页查询立即买入记录
   */
  async page(params: QueryParams): Promise<ApiResponse<ImmediateBuyRecord[]>> {
    return request(`${API_PREFIX}/page`, {
      method: 'GET',
      params,
    });
  },

  /**
   * 分页查询立即买入记录（包含实时订单状态）
   */
  async pageWithOrderStatus(params: QueryParams): Promise<ApiResponse<ImmediateBuyRecord[]>> {
    return request(`${API_PREFIX}/page-with-order-status`, {
      method: 'GET',
      params,
    });
  },

  /**
   * 根据ID查询立即买入记录详情
   */
  async getById(id: number): Promise<ApiResponse<ImmediateBuyRecord>> {
    return request(`${API_PREFIX}/${id}`, {
      method: 'GET',
    });
  },

  /**
   * 撤销订单
   */
  async cancelOrder(recordId: number): Promise<ApiResponse<void>> {
    return request(`${API_PREFIX}/cancel-order/${recordId}`, {
      method: 'POST',
    });
  },

  /**
   * 批量撤销订单
   */
  async batchCancelOrder(recordIds: number[]): Promise<ApiResponse<BatchCancelOrderResult>> {
    return request(`${API_PREFIX}/batch-cancel-orders`, {
      method: 'POST',
      data: recordIds,
    });
  },

  /**
   * 删除立即买入记录
   */
  async deleteById(id: number): Promise<ApiResponse<void>> {
    return request(`${API_PREFIX}/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * 批量删除立即买入记录
   */
  async batchDelete(ids: number[]): Promise<ApiResponse<void>> {
    return request(`${API_PREFIX}/batch`, {
      method: 'DELETE',
      data: ids,
    });
  },
}; 