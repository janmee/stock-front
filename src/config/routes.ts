// ... 现有代码 ...

const routes = [
  // ... 其他路由 ...
  {
    path: '/dingtou',
    name: 'dingtou',
    icon: 'LineChartOutlined',  // 使用折线图图标，你也可以选择其他适合的图标
    component: './Dingtou',
    access: 'canUser',  // 根据你的权限配置调整
  },
  // ... 其他路由 ...
];

export default routes;