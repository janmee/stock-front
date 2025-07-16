import { default as menu } from './en-US/menu';
import { default as pages } from './en-US/pages';
import { default as component } from './en-US/component';
import { default as globalHeader } from './en-US/globalHeader';
import { default as settingDrawer } from './en-US/settingDrawer';
import { default as settings } from './en-US/settings';
import { default as pwa } from './en-US/pwa';

export default {
  'navBar.lang': 'Languages',
  'layout.user.link.help': 'Help',
  'layout.user.link.privacy': 'Privacy',
  'layout.user.link.terms': 'Terms',
  'app.copyright.produced': 'mwang.online',
  'app.preview.down.block': 'Download this page to your local project',
  'app.welcome.link.fetch-blocks': 'Get all block',
  'app.welcome.link.block-list': 'Quickly build standard, pages based on `block` development',
  'app.title': 'Hongdao Intelligent Quantitative Trading',
  ...globalHeader,
  ...menu,
  ...settingDrawer,
  ...settings,
  ...pwa,
  ...component,
  ...pages,
  
  // Error messages
  'component.message.fetchAccountListFailed': 'Failed to fetch account list',
  'component.message.fetchDataFailed': 'Failed to fetch data',
  'component.message.fetchTradingStatsFailed': 'Failed to fetch trading statistics',
  'component.loading': 'Loading...',
  
  // Menu items
  'menu.dashboard': 'Dashboard',
  'menu.earnings': 'Earnings Calendar',
  
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
  'list.realtime-regression.price': 'Price',
  'list.realtime-regression.profit': 'Profit',
  'list.realtime-regression.profit-rate': 'Profit Rate',
  'list.realtime-regression.hold-days': 'Hold Days',

  // Jinshi Data
  'pages.jinshiData.refresh': 'Refresh',
  'pages.jinshiData.refreshSuccess': 'Refresh successful',
  'pages.jinshiData.refreshFailed': 'Refresh failed',
  'pages.jinshiData.search.placeholder': 'Search keywords',
  'pages.jinshiData.filter.type': 'Type',
  'pages.jinshiData.filter.important': 'Importance',
  'pages.jinshiData.type.news': 'News',
  'pages.jinshiData.type.other': 'Other',
  'pages.jinshiData.type.analysis': 'Analysis',
  'pages.jinshiData.type.unknown': 'Unknown',
  'pages.jinshiData.important.normal': 'Normal',
  'pages.jinshiData.important.high': 'Important',
  'pages.jinshiData.empty': 'No data',
  'pages.jinshiData.noMore': 'No more data',
  'pages.jinshiData.startTime': 'Start Time',
  'pages.jinshiData.endTime': 'End Time',
  'pages.jinshiData.timeRangeMode': 'Time Range Query Mode: Only query historical data from database, no latest data fetch',
  'pages.jinshiData.showAll': 'Show All',
  'pages.jinshiData.pagination': 'Pagination',
  'pages.jinshiData.showAllMode': 'Show All Data Mode: All data loaded, no scroll loading needed',
  'pages.jinshiData.totalDataCount': 'Total {count} data loaded',
  'pages.jinshiData.expand': 'Expand',
  'pages.jinshiData.collapse': 'Collapse',
  'pages.jinshiData.hasLink': 'Link',
};
