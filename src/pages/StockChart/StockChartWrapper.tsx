import React, { useEffect, useRef } from 'react';
import { init, dispose, registerIndicator, KLineData } from 'klinecharts';
import moment from 'moment';
import { message } from 'antd';

// 分时图数据点格式
interface DataPoint {
  time: string;
  value: number;
  type: string;
  rawTime?: string;
  orderNo?: string;
  number?: number;
  fillQty?: number;
  accountName?: string;
  extra?: string;
  pointId?: string;
  pointType?: 'buy' | 'sell';
}

// 标记点位数据格式
interface MarkPoint {
  id?: string;
  coordinate: [number, number]; // [timestamp, price]
  value?: string;
  color?: string;
  pointType?: 'buy' | 'sell';
  orderNo?: string;
  accountName?: string;
  extra?: string;
  number?: number;
  fillQty?: number;
}

interface StockChartWrapperProps {
  chartData: DataPoint[];
  height?: number;
  width?: string;
}

// 扩展K线数据类型，添加均价字段
interface ExtendedKLineData extends KLineData {
  avgPrice?: number;
}

const StockChartWrapper: React.FC<StockChartWrapperProps> = ({
  chartData,
  height = 380,
  width = '100%'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<any>(null);

  console.log('分时图数据点数:', chartData);
  
  // 输出数据类型统计
  if (chartData.length > 0) {
    const types = new Set(chartData.map(item => item.type));
    console.log('数据类型:', Array.from(types));
    
    // 输出买卖点数据
    const buyPoints = chartData.filter(item => item.type.includes('买入点') || item.pointType === 'buy');
    const sellPoints = chartData.filter(item => item.type.includes('卖出点') || item.pointType === 'sell');
    console.log('买入点数量:', buyPoints.length, buyPoints);
    console.log('卖出点数量:', sellPoints.length, sellPoints);
    
    // 输出价格线和均价线数据样本
    const priceData = chartData.filter(item => 
      item.type.includes('当前价') || item.type.includes('现价') || item.type === '当前价'
    );
    const avgPriceData = chartData.filter(item => 
      item.type.includes('均价') || item.type === '均价'
    );
    console.log('当前价数据点数:', priceData.length, priceData.length > 0 ? priceData[0] : null);
    console.log('均价数据点数:', avgPriceData.length, avgPriceData.length > 0 ? avgPriceData[0] : null);
  }

  // 销毁图表实例
  const disposeChart = () => {
    if (chartInstanceRef.current) {
      console.log('销毁旧的图表实例');
      try {
        if (chartRef.current) {
          dispose(chartRef.current);
        }
        chartInstanceRef.current = null;
      } catch (error) {
        console.error('销毁图表实例失败:', error);
      }
    }
  };

  // 组件挂载和更新时执行
  useEffect(() => {
    console.log('StockChartWrapper 组件挂载或更新, 数据点数:', chartData);
    
    // 初始化图表
    if (!chartRef.current) {
      console.error('图表容器DOM元素不存在');
      return;
    }
    
    try {
      // 确保旧实例被销毁
      disposeChart();
      
      // 初始化图表
      console.log('正在初始化分时图...');
      const chart = init(chartRef.current, {
        // layout: [
        //   {
        //     type: 'indicator' as any,
        //     content: ['MA'],
        //     options: { order: Number.MIN_SAFE_INTEGER },
        //   },
        //   { type: 'xAxis' as any, options: { order: 9 } },
        // ],
        timezone: 'Asia/Shanghai'
      } as any);
      
      // 保存图表实例
      chartInstanceRef.current = chart;
      
      if (!chart) {
        console.error('图表实例创建失败');
        return;
      }
      
      // 禁用图表的缩放和拖动功能
      try {
        // 禁用缩放
        chart.setZoomEnabled(true);
        // 禁用滚动
        chart.setScrollEnabled(true);
        // 设置右侧留白
        chart.setOffsetRightDistance(10);
        chart.setMaxOffsetLeftDistance(10);
        chart.setMaxOffsetRightDistance(10);
        chart.setBarSpace(2.5);
      } catch (e) {
        console.error('设置图表交互属性失败:', e);
      }
      
      // 如果有数据，则处理数据
      if (chartData.length > 0) {
        // 分离不同类型的数据
        const priceData = chartData.filter(point => 
          point.type === '当前价' || point.type.includes('当前价')
        );
        
        const avgPriceData = chartData.filter(point => 
          point.type === '均价' || point.type.includes('均价')
        );
        
        const buyPoints = chartData.filter(point => 
          point.type === '买入点' || point.type.includes('买入点') || point.pointType === 'buy'
        );
        
        const sellPoints = chartData.filter(point => 
          point.type === '卖出点' || point.type.includes('卖出点') || point.pointType === 'sell'
        );
        
        console.log(`处理数据分类结果：价格线 ${priceData.length}，均价线 ${avgPriceData.length}，买入点 ${buyPoints.length}，卖出点 ${sellPoints.length}`);
        
        if (priceData.length === 0) {
          console.warn('没有价格数据，无法渲染图表');
          return;
        }
        
        // 准备基础数据
        const baseKLineData = priceData.map(point => {
          const timestamp = point.rawTime 
            ? new Date(point.rawTime).getTime() 
            : moment(`${moment().format('YYYY')} ${point.time}`, 'YYYY MM-DD HH:mm').valueOf();
          
          return {
            timestamp,
            open: point.value,
            high: point.value,
            low: point.value,
            close: point.value,
            volume: 0
          };
        });
        
        // 准备包含均价的数据
        const kLineData = baseKLineData.map((kline) => {
          // 根据时间找到对应的均价数据点
          const matchTime = moment(kline.timestamp).format('MM-DD HH:mm');
          const avgPoint = avgPriceData.find(avg => avg.time === matchTime);
          
          return {
            ...kline,
            // 如果找到对应均价数据，使用其值，否则使用当前价的95%作为默认均价
            avgPrice: avgPoint ? avgPoint.value : kline.close * 0.95
          };
        });
        
        console.log('处理后的K线数据样本:', kLineData.slice(0, 3));
        
        // 设置主数据
        chart.applyNewData(kLineData);
        
        // 应用数据后，调整图表显示所有数据
        try {
          // 设置基本样式
          chart.setStyles({
            grid: {
              show: true,
              horizontal: {
                show: true,
                size: 1,
                color: '#EDEDED',
                style: 'dashed'
              },
              vertical: {
                show: true,
                size: 1,
                color: '#EDEDED',
                style: 'dashed'
              }
            },
            candle: {
              type: 'area',
              area: {
                lineColor: '#1677FF',
                lineSize: 2,
                value: 'close',
                backgroundColor: 'rgba(22, 119, 255, 0.08)'
              }
            },
            xAxis: {
              tickText: {
                size: 10
              }
            },
            yAxis: {
              tickText: {
                size: 10
              },
              // 自动计算刻度
              autoCalcTickCount: true
            }
          } as any);
          
          // 设置全局精度
          chart.setPrecision({
            price: 2,
            volume: 0
          } as any);
          
          // 适应当前容器尺寸
          chart.resize();
          
          // 刷新图表视图
          setTimeout(() => {
            try {
              // 重新调整大小以确保适应容器
              chart.resize();
              
              // 确保显示整个数据集
              if (kLineData.length > 0) {
                // 尝试将所有数据显示在一个屏幕内
                try {
                  // 重新加载数据并强制适应容器
                  chart.applyNewData(kLineData, true);
                  
                  // 使用更基本的方法确保数据可见
                  // 通过获取时间范围，确保显示所有数据
                  if (kLineData.length > 1) {
                    const firstTimestamp = kLineData[0].timestamp;
                    const lastTimestamp = kLineData[kLineData.length - 1].timestamp;
                    
                    // 设置时间范围
                    try {
                      // 调整可见时间范围
                      const dataWindow = {
                        from: firstTimestamp, 
                        to: lastTimestamp
                      };
                      
                      // 尝试设置时间范围，如果该方法存在
                      if (typeof (chart as any).setDataSpace === 'function') {
                        (chart as any).setDataSpace(30);
                      }
                      
                      // 再次调整大小确保数据适应容器
                      chart.resize();
                    } catch (e) {
                      console.error('设置时间范围失败:', e);
                    }
                  }
                } catch (e) {
                  console.error('适应所有数据失败:', e);
                }
              }
            } catch (e) {
              console.error('调整图表显示范围失败:', e);
            }
          }, 100);
        } catch (e) {
          console.error('设置图表样式失败:', e);
        }
        
        // 注册并添加均价线指标
        if (avgPriceData.length > 0 || kLineData.length > 0) {

            // 创建一个包含均价和现价的组合指标
          registerIndicator({
            name: 'PRICE_AVG_COMPARE',
            shortName: 'CURRENT_AVG',
            series: 'price',
            precision: 2,
            figures: [
              { key: 'price', title: '现价: ', type: 'line', styles: () => ({ color: '#1677FF', size: 2})},
              { key: 'avg', title: '均价: ', type: 'line', styles: () => ({ color: '#FFA500', size: 2}) }
            ],
            calc: (dataList: any[]) => {
              return dataList.map((data) => {
                const avgValue = data.avgPrice || data.close * 0.95;
                return { 
                  price: data.close,
                  avg: avgValue
                };
              });
            }
          } as any);

          // 使用组合指标
          chart.createIndicator('PRICE_AVG_COMPARE', false, {
            styles: {
              price: {
                color: '#FFCC00', // 蓝色
                size: 2,
                style: 'solid'
              },
              avg: {
                color: '#1677FF', // 黄色
                size: 2,
                style: 'solid'
              }
            }
          } as any);
          console.log('价格与均价对比线添加成功');
        
        }
        
        // 处理买卖点标记
        if (buyPoints.length > 0 || sellPoints.length > 0) {
          console.log('开始添加买卖点标记...');
          
          // 添加买入点标记
          buyPoints.forEach(point => {
            try {
              const timestamp = point.rawTime 
                ? new Date(point.rawTime).getTime() 
                : moment(`${moment().format('YYYY')} ${point.time}`, 'YYYY MM-DD HH:mm').valueOf();
              
              const pointId = point.pointId || `buy_${point.orderNo || Math.random().toString(36).substring(2, 10)}`;
              
              // 先尝试移除可能存在的同ID标记点
              try {
                if (chart) {
                  chart.removeOverlay({ id: pointId });
                }
              } catch (e) {
                // 忽略移除不存在的标记点时的错误
              }
              
              if (chart) {
                chart.createOverlay({
                  name: 'simpleAnnotation',
                  id: pointId,
                  points: [{ timestamp, value: point.value }],
                  extendData: 'B',
                  styles: {
                    polygon: {
                      color: '#FF5500', // 红色
                      borderColor: '#FF5500',
                      borderSize: 1,
                      radius: 5,
                      activeColor: '#FF5500',
                      activeBorderColor: '#FF5500',
                      activeBorderSize: 2,
                      activeRadius: 7
                    },
                    text: {
                      color: '#FFFFFF',
                      size: 12,
                      weight: 'bold',
                      family: 'Arial',
                      marginLeft: 4,
                      marginTop: 6,
                      marginRight: 0,
                      marginBottom: 0,
                      backgroundColor: '#FF5500'
                    }
                  }
                } as any);
                console.log(`成功添加买入点标记: ${pointId}, 时间: ${point.time}, 价格: ${point.value}`);
              }
            } catch (err) {
              console.error('添加买入点标记失败:', err, point);
            }
          });
          
          // 添加卖出点标记
          sellPoints.forEach(point => {
            try {
              const timestamp = point.rawTime 
                ? new Date(point.rawTime).getTime() 
                : moment(`${moment().format('YYYY')} ${point.time}`, 'YYYY MM-DD HH:mm').valueOf();
              
              const pointId = point.pointId || `sell_${point.orderNo || Math.random().toString(36).substring(2, 10)}`;
              
              // 先尝试移除可能存在的同ID标记点
              try {
                if (chart) {
                  chart.removeOverlay({ id: pointId });
                }
              } catch (e) {
                // 忽略移除不存在的标记点时的错误
              }
              
              if (chart) {
                chart.createOverlay({
                  name: 'simpleAnnotation',
                  id: pointId,
                  points: [{ timestamp, value: point.value }],
                  extendData: 'S',
                  styles: {
                    polygon: {
                      color: '#00A800', // 绿色
                      borderColor: '#00A800',
                      borderSize: 1,
                      radius: 5,
                      activeColor: '#00A800',
                      activeBorderColor: '#00A800',
                      activeBorderSize: 2,
                      activeRadius: 7
                    },
                    text: {
                      color: '#FFFFFF',
                      size: 12,
                      weight: 'bold',
                      family: 'Arial',
                      marginLeft: 4,
                      marginTop: 6,
                      marginRight: 0,
                      marginBottom: 0,
                      backgroundColor: '#00A800'
                    }
                  }
                } as any);
                console.log(`成功添加卖出点标记: ${pointId}, 时间: ${point.time}, 价格: ${point.value}`);
              }
            } catch (err) {
              console.error('添加卖出点标记失败:', err, point);
            }
          });
          
          console.log(`共添加买卖点标记: 买入点 ${buyPoints.length} 个, 卖出点 ${sellPoints.length} 个`);
        }
      }
      
      console.log('分时图初始化成功');
    } catch (error) {
      console.error('分时图初始化失败:', error);
      message.error('图表初始化失败，请刷新页面重试');
    }
    
    // 组件卸载时清理图表
    return () => {
      console.log('StockChartWrapper 组件卸载，销毁图表');
      disposeChart();
    };
  }, [chartData]); // 当图表数据变化时重新执行

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width, 
        height, 
        userSelect: 'none',
        borderRadius: '4px',
        border: '1px solid #f0f0f0'
      }}
    />
  );
};

export default StockChartWrapper; 