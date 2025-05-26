/**
 * K线图调试工具
 */

import moment from 'moment';

// 生成测试K线数据
export const generateTestKLineData = (count = 100, basePrice = 100) => {
  const data = [];
  let timestamp = new Date().getTime() - count * 60 * 1000;
  let price = basePrice;
  
  for (let i = 0; i < count; i++) {
    const random = Math.random() * 2 - 1; // -1 到 1之间的随机数
    price = price + random;
    
    data.push({
      timestamp,
      open: price,
      high: price + Math.random(),
      low: price - Math.random(),
      close: price + Math.random() * 2 - 1,
      volume: Math.round(Math.random() * 1000)
    });
    
    timestamp += 60 * 1000; // 增加1分钟
  }
  
  return data;
};

// 生成测试买卖点数据
export const generateTestMarkPoints = (klineData: any[], count = 5) => {
  if (!klineData || klineData.length === 0) return [];
  
  const markPoints = [];
  const step = Math.floor(klineData.length / (count * 2));
  
  // 生成买点
  for (let i = 0; i < count; i++) {
    const index = i * step * 2;
    if (index < klineData.length) {
      const point = klineData[index];
      markPoints.push({
        id: `buy_${i}`,
        coordinate: [point.timestamp, point.close] as [number, number],
        color: '#f5222d',
        value: '买',
        pointType: 'buy' as 'buy',
        orderNo: `BUY_${i}`,
        accountName: 'TestAccount',
        extra: '测试买点',
        number: 100,
        fillQty: 100
      });
    }
  }
  
  // 生成卖点
  for (let i = 0; i < count; i++) {
    const index = i * step * 2 + step;
    if (index < klineData.length) {
      const point = klineData[index];
      markPoints.push({
        id: `sell_${i}`,
        coordinate: [point.timestamp, point.close] as [number, number],
        color: '#52c41a',
        value: '卖',
        pointType: 'sell' as 'sell',
        orderNo: `SELL_${i}`,
        accountName: 'TestAccount',
        extra: '测试卖点',
        number: 100,
        fillQty: 100
      });
    }
  }
  
  return markPoints;
};

// 检查K线图数据完整性
export const checkKLineDataIntegrity = (klineData: any[]) => {
  if (!klineData || klineData.length === 0) {
    console.error('K线数据为空');
    return false;
  }
  
  // 检查数据格式
  const firstPoint = klineData[0];
  const requiredFields = ['timestamp', 'open', 'high', 'low', 'close'];
  
  for (const field of requiredFields) {
    if (typeof firstPoint[field] === 'undefined') {
      console.error(`K线数据缺少必需字段: ${field}`);
      return false;
    }
  }
  
  // 检查时间戳是否为数字
  if (typeof firstPoint.timestamp !== 'number') {
    console.error('时间戳类型错误，应为数字');
    return false;
  }
  
  // 检查价格字段是否为数字
  const priceFields = ['open', 'high', 'low', 'close'];
  for (const field of priceFields) {
    if (typeof firstPoint[field] !== 'number') {
      console.error(`${field}字段类型错误，应为数字`);
      return false;
    }
  }
  
  // 检查时间戳是否递增
  let prevTimestamp = 0;
  for (let i = 0; i < klineData.length; i++) {
    const timestamp = klineData[i].timestamp;
    if (i > 0 && timestamp <= prevTimestamp) {
      console.warn(`数据点 ${i} 的时间戳未严格递增: ${moment(timestamp).format('YYYY-MM-DD HH:mm:ss')}`);
    }
    prevTimestamp = timestamp;
  }
  
  console.log('K线数据完整性检查通过');
  return true;
};

// 格式化API响应数据为K线图所需格式
export const formatApiDataToKLine = (apiData: any) => {
  if (!apiData || !apiData.minuteData || apiData.minuteData.length === 0) {
    return [];
  }
  
  return apiData.minuteData.map((item: any) => ({
    timestamp: item.timestamp,
    open: item.current || 0,
    high: item.current || 0,
    low: item.current || 0,
    close: item.current || 0,
    volume: item.volume || 0
  }));
};

// 导出调试信息到控制台
export const debugKLineChart = (klineData: any[], markPoints: any[]) => {
  console.group('K线图调试信息');
  console.log('K线数据点数:', klineData.length);
  if (klineData.length > 0) {
    console.log('第一个数据点:', klineData[0]);
    console.log('最后一个数据点:', klineData[klineData.length - 1]);
  }
  
  console.log('标记点数:', markPoints.length);
  if (markPoints.length > 0) {
    console.log('第一个标记点:', markPoints[0]);
  }
  
  checkKLineDataIntegrity(klineData);
  console.groupEnd();
}; 