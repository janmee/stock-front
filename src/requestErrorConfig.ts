import type {RequestOptions} from '@@/plugin-request/request';
import type {RequestConfig} from '@umijs/max';
import {history} from '@umijs/max';
import {message} from "antd";


// 与后端约定的响应数据格式
interface ResponseStructure {
  success: boolean;
  data: any;
  errorCode?: number;
  errorMessage?: string;
}

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  // 错误处理： umi@3 的错误处理方案。
  errorConfig: {
    // 错误抛出
    errorThrower: (res: any) => {
      const { success, data, errorCode, errorMessage } = res;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, data };
        throw error; // 抛出自制的错误
      }
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      
      // 我们的错误处理器
      if (error.name === 'BizError') {
        const errorInfo: any = error.info;
        if (errorInfo) {
          const { errorCode, errorMessage } = errorInfo;
          
          // 处理登录相关错误码: 1001(登录失效) 和 1011(无token)
          if (errorCode === 1001 || errorCode === 1011) {
            // 登录失效或无token，清除token
            localStorage.removeItem('token');
            message.error(errorMessage || '登录状态异常，请重新登录');
            
            // 获取当前页面URL，保存以便登录后返回
            const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
            
            // 重定向到登录页面
            if (window.location.pathname !== '/user/login') {
              window.location.href = `/user/login?redirect=${currentPath}`;
            }
            return;
          }
          
          message.error(errorMessage);
        }
      } else if (error.response) {
        // 请求已发送但服务端返回状态码非 2xx 的响应
        console.log('Response error:', error.response.status);
        message.error('请求错误 ' + error.response.status);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        console.log('Request error', error.request);
        message.error('网络错误，请检查您的网络连接');
      } else {
        // 发送请求时出了点问题
        console.log('Error', error.message);
        message.error('请求失败: ' + error.message);
      }
    },
  },

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      // 拦截请求配置，进行个性化处理。
      const token = localStorage.getItem('token') || '';
      config.headers = {...config.headers, token};
      return {...config};
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      try {
        // 拦截响应数据，进行个性化处理
        const {data} = response as unknown as ResponseStructure;

        // 处理登录相关错误码: 1001(登录失效) 和 1011(无token)
        if (data?.errorCode == 1001 || data?.errorCode == 1011) {
          // 登录失效或无token，清除token
          localStorage.removeItem('token');
          message.error(data.errorMessage || '登录状态异常，请重新登录');
          
          // 获取当前页面URL，保存以便登录后返回
          const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
          
          // 重定向到登录页面，使用window.location强制跳转
          if (window.location.pathname !== '/user/login') {
            window.location.href = `/user/login?redirect=${currentPath}`;
          }
        }

        if (!data?.success) {
          message.error(data.errorMessage || '操作失败')
        }

        return response;
      } catch (error) {
        console.error('Response interception error:', error);
        return response;
      }
    },
  ],
};
