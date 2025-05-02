import Footer from '@/components/Footer';
import {Question, SelectLang} from '@/components/RightContent';
import {LinkOutlined} from '@ant-design/icons';
import type {Settings as LayoutSettings} from '@ant-design/pro-components';
import type {RunTimeLayoutConfig} from '@umijs/max';
import {history, Link} from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import {errorConfig} from './requestErrorConfig';
import {currentUser as queryCurrentUser} from './services/ant-design-pro/api';
import React from 'react';
import {AvatarDropdown, AvatarName} from './components/RightContent/AvatarDropdown';
import {message} from 'antd';

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/user/login';


/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(aa: any): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  wsLog?: any;
  wsJob?: any;
  logs?: string;
  connected?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
}> {

  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (error) {
      console.error('获取用户信息失败', error);
      return undefined;
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  const {location} = history;
  if (location.pathname !== loginPath) {
    const currentUser = await fetchUserInfo();
    // 如果获取用户信息失败且不在登录页，则跳转到登录页
    if (!currentUser) {
      history.push(loginPath);
      return {
        fetchUserInfo,
        settings: defaultSettings as Partial<LayoutSettings>,
      };
    }
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }
  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({initialState, setInitialState}) => {
  return {
    actionsRender: () => [<Question key="doc"/>, <SelectLang key="SelectLang"/>],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName/>,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      // 水印设置
      // content: initialState?.currentUser?.name,
    },
    // on
    footerRender: () => <Footer/>,

    // 添加页面变化监听，确保未登录时跳转到登录页
    onPageChange: (page) => {
      const { location } = history;
      
      // 检查本地是否存在token，如果不存在，且不在登录页面，则跳转到登录页
      const token = localStorage.getItem('token');
      if (!token && location.pathname !== loginPath) {
        message.error('无token，请先登录');
        // 记录当前页面，以便登录后返回
        const currentPath = encodeURIComponent(location.pathname + location.search);
        // 使用window.location强制跳转
        window.location.href = `${loginPath}?redirect=${currentPath}`;
        return;
      }
      
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        // 使用window.location强制跳转
        window.location.href = loginPath;
        return;
      }
      
      // 已登录，根据角色进行页面访问控制
      if (initialState?.currentUser) {
        const { access } = initialState.currentUser;
        const path = location.pathname;
        
        // guest用户只能访问财报页面和登录页
        if (access === 'guest') {
          if (path !== '/Earnings' && 
              path !== '/user/login' && 
              path !== '/') {
            console.log('Guest用户尝试访问未授权页面:', path);
            // 使用window.location强制跳转
            window.location.href = '/Earnings';
          }
        }
      }
    },
    layoutBgImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    // links: isDev ?
    links:
      [
        <Link
          key="openapi"
          to="/"
          target="_blank"
          // ref="https://www.yuque.com/mwangli/kleih7/axga8dz9imansvl4"
        >
          <a href={"https://www.yuque.com/mwangli/kleih7/axga8dz9imansvl4"} target={"_blank"}>
            <LinkOutlined/>
            <span>项目文档</span>
          </a>
        </Link>,
      ],
    // : [],
    menuHeaderRender: undefined,
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      // if (initialState?.loading) return <PageLoading />;
      return (
        <>
          {children}
          {/*<SettingDrawer*/}
          {/*  disableUrlParams*/}
          {/*  enableDarkTheme*/}
          {/*  settings={initialState?.settings}*/}
          {/*  onSettingChange={(settings) => {*/}
          {/*    setInitialState((preInitialState) => ({*/}
          {/*      ...preInitialState,*/}
          {/*      settings,*/}
          {/*    }));*/}
          {/*  }}*/}
          {/*/>*/}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = {
  ...errorConfig,
};
