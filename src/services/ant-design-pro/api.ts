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
  if (msg.data) {
    msg.data.access = 'admin'; // 临时设置所有用户为管理员权限
  }
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

/** 获取定时任务 GET /api/job */
export async function listStrategy(
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
  return request<any>('/api/modelInfo/list', {
    method: 'GET',
    params: {
      ...params,
      sortKey: sort ? Object.keys(sort)[0] : '',
      sortOrder: sort ? Object.values(sort)[0] : '',
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

/** 获取账户列表 GET /api/accountInfo/list */
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
  return request('/api/accountInfo/list', {
    method: 'GET',
    params: {
      ...params,
      sortKey: sort ? Object.keys(sort)[0] : '',
      sortOrder: sort ? Object.values(sort)[0] : '',
    },
    ...(options || {}),
  });
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
export async function createDingtou(
  params: {
    account: string;
    code: string;
    startTime: string;
    allTimes: number;
    rate: number;
    amount: number;
    enable: boolean;
  },
  options?: { [key: string]: any },
) {
  // 验证定投比例和最少金额不能同时为空
  // if ((params.rate === undefined || params.rate === null || params.rate === 0) &&
  //     (params.amount === undefined || params.amount === null || params.amount === 0)) {
  //   message.error('每次定投比例和最少金额不能同时为空');
  //   return false;
  // }
  return request('/api/dingtou', {
    method: 'POST',
    data: params,
    ...(options || {}),
  });
}

/** 更新定投 PUT /api/dingtou/{id} */
export async function updateDingtou(
  params: {
    id: number;
    account?: string;
    code?: string;
    startTime?: string;
    allTimes?: number;
    rate?: number;
    amount?: number;
    enable?: boolean;
  },
  options?: { [key: string]: any },
) {
  // 验证定投比例和最少金额不能同时为空
  if ((params.rate === undefined || params.rate === null || params.rate === 0) &&
      (params.amount === undefined || params.amount === null || params.amount === 0)) {
    message.error('每次定投比例和最少金额不能同时为空');
    return false;
  }
  return request(`/api/dingtou/${params.id}`, {
    method: 'PUT',
    data: params,
    ...(options || {}),
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
