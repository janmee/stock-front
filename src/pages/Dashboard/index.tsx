import { PageContainer } from '@ant-design/pro-components';
import { request } from 'umi';
import React, { useState, useEffect } from 'react';
import { Line } from '@ant-design/plots';
import { Card, DatePicker, Select, Space, message } from 'antd';
import type { LineConfig } from '@ant-design/plots';
import type { RangePickerProps } from 'antd/es/date-picker';
import type { SelectProps } from 'antd/es/select';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;

interface ProfitVo {
  date: string;
  profitPercentage: number;
}

interface ProfitData {
  [key: string]: ProfitVo[];
}

interface AccountInfo {
  account: string;
  name: string;
}

const PAGE_SIZE = 500;

const DashboardList: React.FC = () => {
  const [profitData, setProfitData] = useState<ProfitData>({});
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountPage, setAccountPage] = useState(1);
  const [accountTotal, setAccountTotal] = useState(0);
  const [searchName, setSearchName] = useState('');

  const fetchAccounts = async (page: number = 1, name?: string) => {
    try {
      setAccountLoading(true);
      const result = await request('/api/accountInfo/list', {
        params: {
          current: page,
          pageSize: PAGE_SIZE,
          name: name,
        },
      });
      if (result.success) {
        if (page === 1) {
          setAccounts(result.data || []);
        } else {
          setAccounts((prev) => [...prev, ...(result.data || [])]);
        }
        setAccountTotal(result.total || 0);
      }
    } catch (error) {
      console.error('获取账户列表失败:', error);
      message.error('获取账户列表失败');
    } finally {
      setAccountLoading(false);
    }
  };

  const handleAccountPopupScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { target } = e;
    const div = target as HTMLDivElement;
    if (div.scrollHeight - div.scrollTop - div.clientHeight < 50) {
      const nextPage = accountPage + 1;
      const totalPages = Math.ceil(accountTotal / PAGE_SIZE);
      if (nextPage <= totalPages && !accountLoading) {
        setAccountPage(nextPage);
        fetchAccounts(nextPage, searchName);
      }
    }
  };

  const handleSearch = (value: string) => {
    setSearchName(value);
    setAccountPage(1);
    fetchAccounts(1, value);
  };

  const fetchData = async () => {
    try {
      const result = await request('/api/accountInfo/profit', {
        params: {
          ...(dateRange ? {
            startTime: dateRange[0].format('YYYY-MM-DD'),
            endTime: dateRange[1].format('YYYY-MM-DD'),
          } : {}),
          accounts: selectedAccounts.join(','),
        },
      });
      if (result.success) {
        setProfitData(result.data || {});
      }
    } catch (error) {
      console.error('获取数据失败:', error);
      message.error('获取数据失败');
    }
  };

  useEffect(() => {
    fetchAccounts(1);
    fetchData(); // 初始加载数据
  }, []);

  useEffect(() => {
    fetchData();
  }, [dateRange, selectedAccounts]);

  // 将数据转换为图表所需格式
  const transformData = () => {
    const data: any[] = [];
    Object.entries(profitData).forEach(([account, profits]) => {
      // 按日期排序
      const sortedProfits = [...profits].sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
      sortedProfits.forEach((profit) => {
        data.push({
          account,
          date: profit.date,
          profitPercentage: profit.profitPercentage,
        });
      });
    });
    return data;
  };

  const profitConfig: LineConfig = {
    data: transformData(),
    xField: 'date',
    yField: 'profitPercentage',
    seriesField: 'account',
    xAxis: {
      type: 'time',
      label: {
        formatter: (text) => dayjs(text).format('MM-DD'),
      },
      tickCount: 10,
    },
    yAxis: {
      label: {
        formatter: (val: string) => `${Number(val).toFixed(2)}%`,
      },
    },
    tooltip: {
      formatter: (datum) => {
        return {
          name: datum.account,
          value: `${Number(datum.profitPercentage).toFixed(2)}%`,
          title: dayjs(datum.date).format('YYYY-MM-DD'),
        };
      },
    },
    legend: {
      position: 'top' as const,
    },
    smooth: true,
    connectNulls: true,
    animation: {
      appear: {
        animation: 'path-in',
        duration: 1000,
      },
    },
  };

  // 禁用未来日期
  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current > dayjs().endOf('day');
  };

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    if (dates) {
      setDateRange([dates[0] as Dayjs, dates[1] as Dayjs]);
    } else {
      setDateRange(null);
    }
  };

  return (
    <PageContainer>
      <div style={{ marginBottom: 16, padding: '16px 24px', background: '#f5f5f5', borderRadius: '4px' }}>
        <p style={{ marginBottom: 8, fontWeight: 'bold' }}>数据说明：</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>1. 盈利比例 = (当前资金 - 初始资金) / 初始资金 * 100%</p>
        <p style={{ marginBottom: 8, paddingLeft: 16 }}>2. 当前资金包含现金和所有持仓股票的市值</p>
      </div>

      <Card 
        title="账户盈利趋势" 
        bordered={false}
        extra={
          <Space>
            <Select
              placeholder="选择账户"
              mode="multiple"
              allowClear
              showSearch
              style={{ width: 300 }}
              options={accounts.map(item => ({
                label: `${item.name} (${item.account})`,
                value: item.account,
              }))}
              value={selectedAccounts}
              onChange={setSelectedAccounts}
              loading={accountLoading}
              onPopupScroll={handleAccountPopupScroll}
              maxTagCount="responsive"
              onSearch={handleSearch}
              filterOption={false}
            />
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
              disabledDate={disabledDate}
              allowClear
              placeholder={['开始日期', '结束日期']}
            />
          </Space>
        }
      >
        <Line {...profitConfig} height={400} />
      </Card>
    </PageContainer>
  );
};

export default DashboardList;
