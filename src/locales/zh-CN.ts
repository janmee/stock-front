import { default as component } from './zh-CN/component';
import { default as globalHeader } from './zh-CN/globalHeader';
import { default as menu } from './zh-CN/menu';
import { default as pages } from './zh-CN/pages';
import { default as pwa } from './zh-CN/pwa';
import { default as settingDrawer } from './zh-CN/settingDrawer';
import { default as settings } from './zh-CN/settings';

export default {
  'navBar.lang': '语言',
  'layout.user.link.help': '帮助',
  'layout.user.link.privacy': '隐私',
  'layout.user.link.terms': '条款',
  'app.copyright.produced': 'mwang.online',
  'app.preview.down.block': '下载此页面到本地项目',
  'app.welcome.link.fetch-blocks': '获取全部区块',
  'app.welcome.link.block-list': '基于 block 开发，快速构建标准页面',
  'app.title': '宏道智能量化交易',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  ...pages,

  // Error messages
  'component.message.fetchAccountListFailed': '获取账户列表失败',
  'component.message.fetchDataFailed': '获取数据失败',
  'component.message.fetchTradingStatsFailed': '获取交易统计失败',
  'component.loading': '加载中...',

  // Menu items
  'menu.dashboard': '数据大盘',
  'menu.earnings': '财报日历',

  'list.backtest': '策略回测',
  'list.realtime-regression': '实时策略回归',
  'list.realtime-regression.desc': '实时策略回归',
  'list.realtime-regression.stock-code': '股票代码',
  'list.realtime-regression.sell-profit': '卖出盈利百分比',
  'list.realtime-regression.start': '开始回归',
  'list.realtime-regression.stop': '停止回归',
  'list.realtime-regression.status': '回归状态',
  'list.realtime-regression.status.running': '运行中',
  'list.realtime-regression.status.stopped': '已停止',
  'list.realtime-regression.status.error': '错误',
  'list.realtime-regression.trades': '交易记录',
  'list.realtime-regression.performance': '策略表现',
  'list.realtime-regression.trade-time': '交易时间',
  'list.realtime-regression.price': '价格',
  'list.realtime-regression.profit': '盈亏',
  'list.realtime-regression.profit-rate': '盈亏率',
  'list.realtime-regression.hold-days': '持有天数',

  // Jinshi Data
  'pages.jinshiData.refresh': '刷新',
  'pages.jinshiData.refreshSuccess': '刷新成功',
  'pages.jinshiData.refreshFailed': '刷新失败',
  'pages.jinshiData.search.placeholder': '搜索关键词',
  'pages.jinshiData.filter.type': '类型',
  'pages.jinshiData.filter.important': '重要性',
  'pages.jinshiData.type.news': '快讯',
  'pages.jinshiData.type.other': '其他',
  'pages.jinshiData.type.analysis': '分析',
  'pages.jinshiData.type.unknown': '未知',
  'pages.jinshiData.important.normal': '一般',
  'pages.jinshiData.important.high': '重要',
  'pages.jinshiData.empty': '暂无数据',
  'pages.jinshiData.noMore': '没有更多数据了',
  'pages.jinshiData.startTime': '开始时间',
  'pages.jinshiData.endTime': '结束时间',
  'pages.jinshiData.timeRangeMode': '时间范围查询模式：仅查询数据库中的历史数据，不获取最新数据',
  'pages.jinshiData.showAll': '显示全部',
  'pages.jinshiData.pagination': '分页显示',
  'pages.jinshiData.showAllMode': '显示全部数据模式：已加载所有数据，无需滚动加载',
  'pages.jinshiData.totalDataCount': '共加载 {count} 条数据',
  'pages.jinshiData.expand': '展开',
  'pages.jinshiData.collapse': '收起',
  'pages.jinshiData.hasLink': '链接',
};
