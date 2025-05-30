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
  
  // Dashboard page
  'dashboard.data.explanation': 'Data Explanation:',
  'dashboard.data.explanation.1': '1. Profit Percentage = (Current Funds - Initial Funds) / Initial Funds * 100%',
  'dashboard.data.explanation.2': '2. Current Funds include cash and the market value of all stock positions',
  'dashboard.data.explanation.3': '3. Trading statistics include realized profits/losses and unrealized position gains/losses',
  'dashboard.stats.title': 'Trading Statistics',
  'dashboard.stats.overall': 'Overall Statistics',
  'dashboard.stats.total.buy.count': 'Total Buy Transactions',
  'dashboard.stats.total.profit': 'Total Profit/Loss',
  'dashboard.stats.unrealized.profit': 'Unrealized Profit/Loss',
  'dashboard.stats.positions': 'Positions',
  'dashboard.stats.strategy': 'Strategy Trading Statistics',
  'dashboard.stats.dingtou.total': 'Total DCA Trades',
  'dashboard.stats.success.rate': 'Success Rate',
  'dashboard.stats.regular.dingtou': 'Regular DCA',
  'dashboard.stats.callback.dingtou': 'DCA Callback Buys',
  'dashboard.stats.avg.strategy': 'Moving Average Strategy Trades',
  'dashboard.stats.manual': 'Manual Trading Statistics',
  'dashboard.stats.trade.count': 'Trade Count',
  'dashboard.stats.trade.profit': 'Trading Profit/Loss',
  'dashboard.profit.trend': 'Account Profit Trend',
  'dashboard.select.account': 'Select Account',
  'dashboard.date.start': 'Start Date',
  'dashboard.date.end': 'End Date',
  
  // Dashboard banner professional content
  'dashboard.banner.title': 'US Stock Investment · Intelligent Quantitative Trading Platform',
  'dashboard.banner.subtitle': '5×24 Hours Quantitative Trading, Multi-Strategy Real-Time Execution, Automated Risk Control',
  'dashboard.banner.feature.1': 'Professional Strategy Models · Based on Massive Data Analysis',
  'dashboard.banner.feature.2': 'Intelligent Risk Management · Dynamic Position Adjustment',
  'dashboard.banner.feature.3': 'Global Asset Allocation · Low Correlation Diversified Investment',
  'dashboard.banner.action': 'Start Your Smart Investment Journey',
};
