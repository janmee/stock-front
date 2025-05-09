import component from './zh-CN/component';
import globalHeader from './zh-CN/globalHeader';
import menu from './zh-CN/menu';
import pages from './zh-CN/pages';
import pwa from './zh-CN/pwa';
import settingDrawer from './zh-CN/settingDrawer';
import settings from './zh-CN/settings';

export default {
  'navBar.lang': '语言',
  'layout.user.link.help': '帮助',
  'layout.user.link.privacy': '隐私',
  'layout.user.link.terms': '条款',
  'app.copyright.produced': 'mwang.online',
  'app.preview.down.block': '下载此页面到本地项目',
  'app.welcome.link.fetch-blocks': '获取全部区块',
  'app.welcome.link.block-list': '基于 block 开发，快速构建标准页面',
  'app.title': '鸿道智能量化交易',
  ...pages,
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  
  // 错误消息
  'component.message.fetchAccountListFailed': '获取账户列表失败',
  'component.message.fetchDataFailed': '获取数据失败',
  'component.message.fetchTradingStatsFailed': '获取交易统计数据失败',
  'component.loading': '加载中...',
  
  // 菜单项
  'menu.dashboard': '数据大盘',
  'menu.earnings': '财报日历',
  
  'list.backtest': '策略回测',
  'list.realtime-regression': '分时平均线策略回测',
  'list.realtime-regression.desc': '分时平均线策略回测',
  'list.realtime-regression.stock-code': '股票代码',
  'list.realtime-regression.sell-profit': '卖出利润百分比',
  'list.realtime-regression.start': '开始回测',
  'list.realtime-regression.stop': '停止回测',
  'list.realtime-regression.status': '回测状态',
  'list.realtime-regression.trades': '交易记录',
  'list.realtime-regression.performance': '性能指标',
  'list.realtime-regression.has-buy-point': '是否有买入点',
  'list.realtime-regression.buy-time': '买入时间',
  'list.realtime-regression.has-sold-same-day': '是否当天卖出',
  'list.realtime-regression.sell-time': '卖出时间',
  'list.realtime-regression.trade-result': '交易结果',
  'list.realtime-regression.total-trading-days': '有买入点的天数',
  'list.realtime-regression.success-days': '当天完成交易天数',
  'list.realtime-regression.success-rate': '当天交易成功率',
  'list.realtime-regression.avg-holding-time': '平均持仓时间',
  'menu.dingtou': '定投管理',
  'dingtou.form.code': '股票代码',
  'dingtou.form.weekDay': '定投日',
  'dingtou.form.weekDay.tooltip': '选择每周哪一天进行定投',
  'dingtou.form.weekInterval': '定投间隔周数',
  'dingtou.form.weekInterval.tooltip': '每隔多少周定投一次，1表示每周定投',
  'dingtou.form.buyOnIndexDown': '指数下跌时买入',
  'dingtou.form.buyOnIndexDown.tooltip': '开启后，只在指数下跌时进行定投',
  
  // Dashboard页面
  'dashboard.data.explanation': '数据说明：',
  'dashboard.data.explanation.1': '1. 盈利比例 = (当前资金 - 初始资金) / 初始资金 * 100%',
  'dashboard.data.explanation.2': '2. 当前资金包含现金和所有持仓股票的市值',
  'dashboard.data.explanation.3': '3. 交易统计数据包括已实现的盈亏和未实现的持仓盈亏',
  'dashboard.stats.title': '交易数据统计',
  'dashboard.stats.overall': '整体统计',
  'dashboard.stats.total.buy.count': '总买入次数',
  'dashboard.stats.total.profit': '总盈亏',
  'dashboard.stats.unrealized.profit': '未实现盈亏',
  'dashboard.stats.positions': '个持仓',
  'dashboard.stats.strategy': '策略交易统计',
  'dashboard.stats.dingtou.total': '定投交易总计',
  'dashboard.stats.success.rate': '成功率',
  'dashboard.stats.regular.dingtou': '常规定投',
  'dashboard.stats.callback.dingtou': '定投卖出回调买入',
  'dashboard.stats.avg.strategy': '分时平均线策略交易',
  'dashboard.stats.manual': '人工交易统计',
  'dashboard.stats.trade.count': '交易次数',
  'dashboard.stats.trade.profit': '交易盈亏',
  'dashboard.profit.trend': '账户盈利趋势',
  'dashboard.select.account': '选择账户',
  'dashboard.date.start': '开始日期',
  'dashboard.date.end': '结束日期',
};
