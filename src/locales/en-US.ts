import component from './en-US/component';
import globalHeader from './en-US/globalHeader';
import menu from './en-US/menu';
import pages from './en-US/pages';
import pwa from './en-US/pwa';
import settingDrawer from './en-US/settingDrawer';
import settings from './en-US/settings';

export default {
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  'app.copyright.produced': 'Produced by Ant Financial Experience Department',
  'app.preview.down.block': 'Download this page to your local project',
  'app.welcome.link.fetch-blocks': 'Get all block',
  'app.welcome.link.block-list': 'Quickly build standard, pages based on `block` development',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  ...pages,
  'list.backtest': 'Strategy Backtest',
  'list.realtime-regression': 'Real-time Strategy Regression',
  'list.realtime-regression.desc': 'Real-time Strategy Regression',
  'list.realtime-regression.stock-code': 'Stock Code',
  'list.realtime-regression.sell-profit': 'Sell Profit Percentage',
  'list.realtime-regression.start': 'Start Regression',
  'list.realtime-regression.stop': 'Stop Regression',
  'list.realtime-regression.status': 'Regression Status',
  'list.realtime-regression.status.running': 'Running',
  'list.realtime-regression.status.stopped': 'Stopped',
  'list.realtime-regression.status.error': 'Error',
  'list.realtime-regression.trades': 'Trade Records',
  'list.realtime-regression.performance': 'Performance Metrics',
  'list.realtime-regression.trade-time': 'Trade Time',
  'list.realtime-regression.trade-type': 'Trade Type',
  'list.realtime-regression.trade-price': 'Trade Price',
  'list.realtime-regression.trade-amount': 'Trade Amount',
  'list.realtime-regression.trade-profit': 'Trade Profit',
  'list.realtime-regression.trade-type.buy': 'Buy',
  'list.realtime-regression.trade-type.sell': 'Sell',
  'list.realtime-regression.performance.total-trades': 'Total Trades',
  'list.realtime-regression.performance.win-rate': 'Win Rate',
  'list.realtime-regression.performance.profit-factor': 'Profit Factor',
  'list.realtime-regression.performance.max-drawdown': 'Max Drawdown',
  'list.realtime-regression.performance.sharpe-ratio': 'Sharpe Ratio',
  'list.realtime-regression.performance.total-profit': 'Total Profit',
  'list.realtime-regression.performance.avg-profit': 'Average Profit',
  'list.realtime-regression.performance.avg-holding-time': 'Average Holding Time',
};
