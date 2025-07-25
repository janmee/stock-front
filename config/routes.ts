﻿/**
 * @name umi 的路由配置
 * @description 只支持 path,component,routes,redirect,wrappers,name,icon 的配置
 * @param path  path 只支持两种占位符配置，第一种是动态参数 :id 的形式，第二种是 * 通配符，通配符只能出现路由字符串的最后。
 * @param component 配置 location 和 path 匹配后用于渲染的 React 组件路径。可以是绝对路径，也可以是相对路径，如果是相对路径，会从 src/pages 开始找起。
 * @param routes 配置子路由，通常在需要为多个路径增加 layout 组件时使用。
 * @param redirect 配置路由跳转
 * @param wrappers 配置路由组件的包装组件，通过包装组件可以为当前的路由组件组合进更多的功能。 比如，可以用于路由级别的权限校验
 * @param name 配置路由的标题，默认读取国际化文件 menu.ts 中 menu.xxxx 的值，如配置 name 为 login，则读取 menu.ts 中 menu.login 的取值作为标题
 * @param icon 配置路由的图标，取值参考 https://ant.design/components/icon-cn， 注意去除风格后缀和大小写，如想要配置图标为 <StepBackwardOutlined /> 则取值应为 stepBackward 或 StepBackward，如想要配置图标为 <UserOutlined /> 则取值应为 user 或者 User
 * @doc https://umijs.org/docs/guides/routes
 */
export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        name: 'login',
        path: '/user/login',
        component: './User/Login',
      },
    ],
  },
  // {
  //   path: '/welcome',
  //   name: 'welcome',
  //   icon: 'smile',
  //   component: './Welcome',
  // },
  {
    path: '/dashboard',
    name: 'dashboard',
    icon: 'DashboardOutlined',
    component: './Dashboard',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  // {
  //   path: '/admin',
  //   name: 'admin',
  //   icon: 'crown',
  //   access: 'canAdmin',
  //   routes: [
  //     {
  //       path: '/admin',
  //       redirect: '/admin/sub-page',
  //     },
  //     {
  //       path: '/admin/sub-page',
  //       name: 'sub-page',
  //       component: './Admin',
  //     },
  //   ],
  // },
  // {
  //   name: 'list.analysis',
  //   icon: 'BarChartOutlined',
  //   path: '/analysis',
  //   component: './Analysis',
  //   access: 'canAdmin',
  // },
  // {
  //   name: 'list.stock-info',
  //   icon: 'FundOutlined',
  //   path: '/info',
  //   component: './StockInfo',
  //   access: 'canAdmin',
  // },
  // {
  //   name: 'list.table-list',
  //   icon: 'table',
  //   path: '/list',
  //   component: './RecordList',
  //   access: 'canAdmin',
  // },
  {
    name: 'list.trade',
    icon: 'TrademarkOutlined',
    path: '/trade',
    component: './Trade',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.order-info',
    icon: 'FileDoneOutlined',
    path: '/order',
    component: './OrderInfo',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.account-info',
    icon: 'UserOutlined',
    path: '/account',
    component: './AccountInfo',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  // {
  //   name: 'list.model',
  //   icon: 'AlertOutlined',
  //   path: '/model',
  //   component: './ModelList',
  //   access: 'canAdmin',
  // },
  {
    name: 'list.strategy',
    icon: 'RobotOutlined',
    path: '/strategy',
    component: './Strategy',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.stock-chart',
    icon: 'StockOutlined',
    path: '/stock-chart',
    component: './StockChart',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.strategy-statistics',
    icon: 'BarChart',
    path: '/strategy-statistics',
    component: './StrategyStatistics',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    path: '/strategy-regression',
    name: 'strategyRegression',
    icon: 'LineChartOutlined',
    component: './StrategyRegression',
  },
  {
    name: 'list.scheduled-orders',
    icon: 'ScheduleOutlined',
    path: '/scheduled-orders',
    component: './ScheduledOrders',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.logs-management',
    icon: 'FileTextOutlined',
    path: '/logs-management',
    component: './LogsManagement',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  // {
  //   name: 'list.upload-image',
  //   icon: 'upload',
  //   path: '/upload',
  //   component: './UploadImage',
  //   access: 'canTest',
  // },
  {
    name: 'list.dingtou',
    icon: 'LineChartOutlined',
    path: '/dingtou',
    component: './Dingtou',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.backtest',
    icon: 'FundOutlined',
    path: '/backtest',
    component: './Backtest',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.time-job',
    icon: 'FieldTimeOutlined',
    path: '/job',
    component: './JobList',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.realtime-regression',
    icon: 'LineChartOutlined',
    path: '/realtime-regression',
    component: './RealtimeRegression',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.jinshi-data',
    icon: 'AlertOutlined',
    path: '/jinshi-data',
    component: './JinshiData',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'list.stock-alert',
    icon: 'ExclamationCircleOutlined',
    path: '/stock-alert',
    component: './StockAlert',
    access: 'canAdmin',
    hideInMenu: ({ initialState }: any) => initialState?.currentUser?.access === 'guest',
  },
  {
    name: 'earnings',
    path: '/Earnings',
    icon: 'LineChartOutlined',
    component: './Earnings',
  },
  {
    path: '/',
    redirect: ({ initialState }: any) => {
      // 根据用户角色决定重定向到哪个页面
      const userAccess = initialState?.currentUser?.access;
      if (userAccess === 'admin') {
        return '/dashboard';
      }
      return '/Earnings';
    },
  },
  {
    path: '*',
    layout: false,
    component: './404',
  },
];
