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
  ...pages,
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  'list.backtest': '策略回测',
  'list.realtime-regression': '实时策略回测',
  'list.realtime-regression.desc': '实时策略回测',
  'list.realtime-regression.stock-code': '股票代码',
  'list.realtime-regression.sell-profit': '卖出利润百分比',
  'list.realtime-regression.start': '开始回测',
  'list.realtime-regression.stop': '停止回测',
  'list.realtime-regression.status': '回测状态',
  'list.realtime-regression.status.running': '运行中',
  'list.realtime-regression.status.stopped': '已停止',
  'list.realtime-regression.status.error': '错误',
  'list.realtime-regression.trades': '交易记录',
  'list.realtime-regression.performance': '性能指标',
  'list.realtime-regression.trade-time': '交易时间',
  'list.realtime-regression.trade-type': '交易类型',
  'list.realtime-regression.trade-price': '交易价格',
  'list.realtime-regression.trade-amount': '交易数量',
  'list.realtime-regression.trade-profit': '交易利润',
  'list.realtime-regression.trade-type.buy': '买入',
  'list.realtime-regression.trade-type.sell': '卖出',
  'list.realtime-regression.performance.total-trades': '总交易次数',
  'list.realtime-regression.performance.win-rate': '胜率',
  'list.realtime-regression.performance.profit-factor': '盈亏比',
  'list.realtime-regression.performance.max-drawdown': '最大回撤',
  'list.realtime-regression.performance.sharpe-ratio': '夏普比率',
  'list.realtime-regression.performance.total-profit': '总收益',
  'list.realtime-regression.performance.avg-profit': '平均收益',
  'list.realtime-regression.performance.avg-holding-time': '平均持仓时间',
};
