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
};
