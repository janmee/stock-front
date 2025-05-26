import React, { useEffect, useRef } from 'react';
import { init, dispose, Chart } from 'klinecharts';
import moment from 'moment';

// K线图所需的数据格式
interface KLineData {
  timestamp: number;  // 时间戳
  open: number;       // 开盘价
  high: number;       // 最高价
  low: number;        // 最低价
  close: number;      // 收盘价
  volume?: number;    // 成交量（可选）
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

interface KLineChartWrapperProps {
  klineData: KLineData[];
  markPoints: MarkPoint[];
  height?: number;
  width?: string;
}

const KLineChartWrapper: React.FC<KLineChartWrapperProps> = ({
  klineData,
  markPoints,
  height = 380,
  width = '100%'
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // 组件挂载时初始化图表
  useEffect(() => {
    console.log('K线图组件挂载');
    
    // 延迟初始化图表，确保DOM已经完全渲染
    const timer = setTimeout(() => {
      initChart();
    }, 100);
    
    // 组件卸载时清理图表实例
    return () => {
      clearTimeout(timer);
      disposeChart();
    };
  }, []);

  // 图表初始化函数
  const initChart = () => {
    if (!chartRef.current) {
      console.error('图表容器DOM元素不存在');
      return;
    }

    try {
      // 确保旧实例被销毁
      disposeChart();
      
      // 初始化图表
      console.log('正在初始化图表...');
      chartInstance.current = init(chartRef.current);
      
      // 设置样式
      if (chartInstance.current) {
        chartInstance.current.setStyles({
          candle: {
            bar: {
              upColor: '#f5222d', // 红色 - 上涨颜色
              downColor: '#52c41a', // 绿色 - 下跌颜色
              noChangeColor: '#888888', // 灰色 - 无变化颜色
            }
          }
        });
        console.log('图表初始化成功');
      } else {
        console.error('图表初始化返回null');
      }
    } catch (error) {
      console.error('图表初始化失败:', error);
    }
  };

  // 销毁图表函数
  const disposeChart = () => {
    try {
      if (chartRef.current && chartInstance.current) {
        dispose(chartRef.current);
        chartInstance.current = null;
        console.log('图表实例已销毁');
      }
    } catch (error) {
      console.error('销毁图表失败:', error);
    }
  };

  // 数据变化时更新图表
  useEffect(() => {
    if (!chartInstance.current) {
      console.log('图表未初始化，尝试重新初始化');
      initChart();
      
      // 如果初始化后仍然没有实例，则返回
      if (!chartInstance.current) {
        console.error('图表初始化失败，无法更新数据');
        return;
      }
    }
    
    if (klineData.length === 0) {
      console.log('没有K线数据可显示');
      return;
    }
    
    updateChartData();
  }, [klineData, markPoints]);

  // 更新图表数据
  const updateChartData = () => {
    if (!chartInstance.current) return;
    
    try {
      console.log(`更新图表数据: ${klineData.length}个数据点, ${markPoints.length}个标记点`);
      
      // 清除所有数据
      chartInstance.current.clearData();
      
      // 设置新数据
      chartInstance.current.applyNewData(klineData as any);
      
      // 尝试添加均线指标
      try {
        chartInstance.current.createIndicator('MA', false);
      } catch (err) {
        console.error('添加均线指标失败:', err);
      }
      
      // 添加标记点
      if (markPoints.length > 0) {
        addMarkPoints();
      }
      
      console.log('图表数据更新完成');
    } catch (error) {
      console.error('更新图表数据失败:', error);
    }
  };

  // 添加标记点
  const addMarkPoints = () => {
    if (!chartInstance.current) return;
    
    try {
      // 清除现有标记
      chartInstance.current.removeOverlay();
      
      // 添加新标记点
      markPoints.forEach((point, index) => {
        try {
          const timestamp = point.coordinate[0];
          const price = point.coordinate[1];
          const color = point.pointType === 'buy' ? '#f5222d' : '#52c41a';
          
          // 创建标记点
          chartInstance.current?.createOverlay({
            name: 'simpleAnnotation',
            points: [{ timestamp, value: price }],
            styles: { 
              point: { 
                backgroundColor: color,
                borderColor: color,
                borderSize: 1,
                radius: 4
              }
            }
          } as any);
        } catch (err) {
          console.error(`添加第${index+1}个标记点失败:`, err);
        }
      });
    } catch (error) {
      console.error('添加标记点失败:', error);
    }
  };

  return (
    <div style={{ width }}>
      <div 
        ref={chartRef} 
        style={{ 
          width: '100%', 
          height: `${height}px`,
          background: '#1f1f1f',
          borderRadius: '4px',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        {klineData.length === 0 && (
          <span style={{ color: '#ffffff' }}>暂无图表数据</span>
        )}
      </div>
    </div>
  );
};

export default KLineChartWrapper; 