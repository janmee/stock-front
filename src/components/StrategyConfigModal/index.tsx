import React, { useState, useEffect } from 'react';
import {
  Modal,
  Form,
  Button,
  Space,
  Divider,
  message,
  Tag,
  InputNumber,
  Input,
  Switch,
} from 'antd';
import { 
  PlusOutlined,
  DeleteOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { ModalForm, ProFormText, ProFormDigit, ProFormSelect, ProFormSwitch } from '@ant-design/pro-components';
import { createStrategyStock, batchCreateStrategyUserStock, listAccountInfo } from '@/services/ant-design-pro/api';

interface AccountInfo {
  id: number;
  account: string;
  name: string;
  enable: boolean;
}

interface StrategyConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stockCode: string;
  stockName?: string;
  marketCap?: number;
  onSuccess?: () => void;
}

const StrategyConfigModal: React.FC<StrategyConfigModalProps> = ({
  open,
  onOpenChange,
  stockCode,
  stockName,
  marketCap,
  onSuccess,
}) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [accountOptions, setAccountOptions] = useState<{label: string, value: string, accountInfo: AccountInfo}[]>([]);

  // 获取账户列表
  const fetchAccountOptions = async () => {
    try {
      const response = await listAccountInfo({
        current: 1,
        pageSize: 1000,
        enable: true, // 只获取启用的账户
      }, {});
      
      if (response && response.data) {
        const options = response.data.map((item: AccountInfo) => ({
          label: `${item.account} (${item.name})`,
          value: item.account,
          accountInfo: item,
        }));
        setAccountOptions(options);
      }
    } catch (error) {
      console.error('获取账户列表失败:', error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchAccountOptions();
      
      // 根据市值自动判断市值规模
      let marketCapScale = '中盘股'; // 默认值
      if (marketCap) {
        if (marketCap < 200) {
          marketCapScale = '小盘股';
        } else if (marketCap >= 200 && marketCap < 1000) {
          marketCapScale = '中盘股';
        } else if (marketCap >= 1000) {
          marketCapScale = '大盘股';
        }
      }
      
      // 预填一些默认配置
      form.setFieldsValue({
        strategyId: 1, // 固定策略ID为1
        stockCode: stockCode,
        profitRatio: 1.0, // 默认盈利比例1%
        levelPercent: 1.5, // 默认档位百分比1.5%
        unsoldStackLimit: 2, // 默认未卖出堆栈值
        totalFundShares: 5, // 默认最大持有买入单数
        limitStartShares: 5, // 默认限制开始单数
        enableOpeningBuy: true, // 默认开启开盘买入
        marketCapScale: marketCapScale, // 根据市值自动设置
        enableProfitSellBeforeClose: 'PROFIT_SELL_BEFORE_CLOSE', // 默认收盘前盈利卖出
        enableYesterdayLowestBuy: false, // 默认关闭昨天最低价买入
        status: '1', // 默认启用
        // 应用用户默认配置
        selectedAccounts: [], // 默认不选择任何用户
        userStockStatus: '1', // 默认启用用户股票关系
        // 添加默认时间配置
        startTime: '09:35', // 默认开始时间
        endTime: '15:00', // 默认结束时间
        cooldownTime: 30, // 默认买入冷却时间30分钟
        // 默认时段配置
        timeSegmentMaConfig: [
          { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1.0 },
          { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1.0 },
          { timeSegment: '13:30', maBelowPercent: 2.0, maAbovePercent: -2.0, profitPercent: 1.5 },
        ],
      });
    }
  }, [open, stockCode, marketCap, form]);

  // 保存策略配置
  const handleSaveStrategyConfig = async (values: any) => {
    try {
      console.log('提交的原始表单数据:', values);
      
      // 检查该股票是否已经存在配置
      const checkResponse = await fetch('/api/strategy/stock/page?' + new URLSearchParams({
        current: '1',
        pageSize: '10',
        strategyId: values.strategyId.toString(),
        stockCode: values.stockCode,
      }));
      
      const checkResult = await checkResponse.json();
      
      if (checkResult.success && checkResult.data.records && checkResult.data.records.length > 0) {
        message.warning('该股票已存在策略配置');
        return false;
      }

      // 将百分比值转换为小数
      const processedValues: any = {
        strategyId: values.strategyId,
        strategyName: '反弹上方高位震荡策略', // 策略ID为1对应的策略名称
        stockCode: values.stockCode,
        profitRatio: values.profitRatio / 100,
        levelPercent: values.levelPercent / 100,
        maBelowPercent: values.maBelowPercent / 100,
        maAbovePercent: values.maAbovePercent / 100,
        intraUpPullbackPercent: values.intraUpPullbackPercent / 100,
        intraDnBelowAvgPercent: values.intraDnBelowAvgPercent / 100,
        // 时间和整数字段保持原值
        intraUpDurationMinutes: values.intraUpDurationMinutes,
        intraDnDurationMinutes: values.intraDnDurationMinutes,
        unsoldStackLimit: values.unsoldStackLimit,
        totalFundShares: values.totalFundShares,
        limitStartShares: values.limitStartShares,
        // 布尔和枚举字段
        enableOpeningBuy: values.enableOpeningBuy,
        marketCapScale: values.marketCapScale,
        enableProfitSellBeforeClose: values.enableProfitSellBeforeClose,
        enableYesterdayLowestBuy: values.enableYesterdayLowestBuy,
        status: values.status,
      };

      // 处理时段配置
      if (values.timeSegmentMaConfig && values.timeSegmentMaConfig.length > 0) {
        // 验证时间段格式
        const timeSegments = values.timeSegmentMaConfig.map((item: any) => item.timeSegment);
        const uniqueTimeSegments = [...new Set(timeSegments)];
        
        if (uniqueTimeSegments.length !== timeSegments.length) {
          message.error('时段配置中存在重复的时间段');
          return false;
        }
        
        // 验证时段格式
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        for (const item of values.timeSegmentMaConfig) {
          if (!timeRegex.test(item.timeSegment)) {
            message.error(`时段 ${item.timeSegment} 格式不正确，请使用 HH:mm 格式`);
            return false;
          }
        }
        
        // 按时间排序并转换百分比为小数
        const timeToMinutes = (timeStr: string) => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        };
        
        const sortedConfig = values.timeSegmentMaConfig
          .sort((a: any, b: any) => timeToMinutes(a.timeSegment) - timeToMinutes(b.timeSegment))
          .map((item: any) => ({
            timeSegment: item.timeSegment,
            maBelowPercent: item.maBelowPercent / 100,
            maAbovePercent: item.maAbovePercent / 100,
            profitPercent: item.profitPercent / 100,
          }));
        
        processedValues.timeSegmentMaConfig = JSON.stringify(sortedConfig);
      }

      // 添加默认买入比例配置
      const defaultBuyRatioConfig = {
        firstShareRatio: 3.0,
        extraShares: [
          { drop: 7, ratio: 3, secondStage: false },
          { drop: 7, ratio: 3, secondStage: false },
          { drop: 9, ratio: 4.6, secondStage: false },
          { drop: 9, ratio: 4.6, secondStage: false },
          { drop: 9, ratio: 4.6, secondStage: false },
          { drop: 11, ratio: 6, secondStage: true },
          { drop: 11, ratio: 7.7, secondStage: false },
        ]
      };
      processedValues.buyRatioConfig = JSON.stringify(defaultBuyRatioConfig);

      console.log('处理后的提交数据:', processedValues);

      // 调用创建策略标的API
      const response = await createStrategyStock(processedValues);
      console.log('API响应:', response);
      
      // 批量创建策略用户股票关系（现在是必选的）
      try {
        const batchCreateParams = {
          strategyId: values.strategyId,
          strategyName: '反弹上方高位震荡策略',
          accounts: values.selectedAccounts,
          stockCodes: [values.stockCode],
          maxAmount: values.maxAmount || 80000, // 使用最大金额，默认80000美元
          status: values.userStockStatus || '1',
          startTime: values.startTime || '10:00',
          endTime: values.endTime || '16:00',
          timeZone: 'America/New_York',
          cooldownTime: values.cooldownTime || 30,
          unsoldStackLimit: values.unsoldStackLimit || 4,
          limitStartShares: values.limitStartShares || 9,
          totalFundShares: values.totalFundShares || 18,
          profitRatio: values.profitRatio / 100,
          enableOpeningBuy: values.enableOpeningBuy ? 1 : 0, // 转换boolean为Integer
        };

        console.log('批量创建用户股票关系参数:', batchCreateParams);
        
        const batchResult = await batchCreateStrategyUserStock(batchCreateParams);
        console.log('批量创建用户股票关系响应:', batchResult);
        
        if (batchResult && batchResult.data) {
          const { successCount, failureCount, errorMessages } = batchResult.data;
          
          if (failureCount > 0) {
            message.warning(
              `策略配置创建成功！用户股票关系：成功 ${successCount}，失败 ${failureCount}。${
                errorMessages.length > 0 ? `错误信息：${errorMessages.join('; ')}` : ''
              }`
            );
          } else {
            message.success(`策略配置和用户股票关系创建成功！共配置 ${successCount} 个用户。`);
          }
        } else {
          message.success('策略配置和用户股票关系创建成功！');
        }
      } catch (batchError: any) {
        console.error('批量创建用户股票关系失败:', batchError);
        message.error(`策略配置创建成功，但用户股票关系创建失败：${batchError.message || '未知错误'}`);
      }
      
      onOpenChange(false);
      form.resetFields();
      onSuccess?.();
      return true;
    } catch (error: any) {
      console.error('生成策略配置失败:', error);
      message.error(`生成策略配置失败: ${error.message || '未知错误'}`);
      return false;
    }
  };

  return (
    <ModalForm
      title={
        <Space>
          <ThunderboltOutlined />
          生成策略配置
          {stockName && <Tag color="blue">{stockName}</Tag>}
          <Tag color="green">{stockCode}</Tag>
        </Space>
      }
      open={open}
      onOpenChange={onOpenChange}
      onFinish={handleSaveStrategyConfig}
      form={form}
      layout="vertical"
      width={800}
      modalProps={{
        destroyOnClose: true,
        footer: null,
      }}
      submitter={false}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormText
            name="strategyId"
            label="策略ID"
            disabled
            initialValue={1}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormText
            name="stockCode"
            label="股票代码"
            rules={[{ required: true }]}
            readonly
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="profitRatio"
            label="盈利比例 (%)"
            tooltip="止盈设置的盈利比例（百分比，如10表示10%）"
            min={0}
            max={100}
            fieldProps={{
              step: 0.01,
              precision: 2,
              addonAfter: '%',
            }}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="unsoldStackLimit"
            label="未卖出堆栈值"
            tooltip="每天允许的最大开放买入订单数"
            min={1}
            max={20}
            fieldProps={{
              step: 1,
              precision: 0,
            }}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="limitStartShares"
            label="限制开始单数"
            tooltip="从第几档开始限制买入，默认9"
            min={1}
            max={100}
            fieldProps={{
              step: 1,
              precision: 0,
            }}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="totalFundShares"
            label="最大持有买入单数"
            tooltip="资金分割的总档位数，默认18"
            min={1}
            max={100}
            fieldProps={{
              step: 1,
              precision: 0,
            }}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormDigit
            name="levelPercent"
            label="开盘矩阵单档位百分比(%)"
            tooltip="开盘矩阵单每档买入的百分比，例如1.5表示1.5%"
            min={0}
            max={100}
            fieldProps={{
              step: 0.01,
              precision: 2,
              addonAfter: '%',
            }}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSwitch
            name="enableOpeningBuy"
            label="是否开盘买入"
            tooltip="是否在开盘时执行买入策略"
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="marketCapScale"
            label="市值规模"
            tooltip="根据当前股票市值自动判断：小盘股(<200亿)、中盘股(200-1000亿)、大盘股(≥1000亿)"
            options={[
              { label: '小盘股', value: '小盘股' },
              { label: '中盘股', value: '中盘股' },
              { label: '大盘股', value: '大盘股' },
              { label: 'ETF', value: 'ETF' },
            ]}
            placeholder="请选择市值规模"
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="enableProfitSellBeforeClose"
            label="收盘前盈利卖出"
            tooltip="收盘前盈利卖出策略"
            options={[
              { label: '收盘前总盈利卖出', value: 'PROFIT_SELL_BEFORE_CLOSE' },
              { label: '收盘前全部卖出', value: 'ALL_SELL_BEFORE_CLOSE' },
              { label: '不卖出', value: 'NO_SELL' },
            ]}
            rules={[{ required: true }]}
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSwitch
            name="enableYesterdayLowestBuy"
            label="昨天最低价买入"
            tooltip="是否在股票价格接近昨天最低价时触发买入信号"
          />
        </div>

        <div style={{ width: 'calc(33.33% - 8px)' }}>
          <ProFormSelect
            name="status"
            label="状态"
            options={[
              { label: '启用', value: '1' },
              { label: '禁用', value: '0' },
            ]}
            rules={[{ required: true }]}
          />
        </div>
      </div>

      {/* 时段配置区域 */}
      <Divider>时段配置</Divider>
      <Form.Item
        label="时段配置"
        tooltip="不同时段的分时平均线买入配置，可动态增删"
      >
        <Form.List name="timeSegmentMaConfig">
          {(timeSegmentFields, { add: addTimeSegment, remove: removeTimeSegment }) => (
            <>
              {timeSegmentFields.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  backgroundColor: '#f9f9f9', 
                  borderRadius: '6px',
                  marginBottom: '16px'
                }}>
                  <div style={{ marginBottom: '12px', color: '#666' }}>暂无时段配置</div>
                  <Button 
                    type="primary" 
                    onClick={() => {
                      const defaultSegments = [
                        { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1.0 },
                        { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1.0 },
                        { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1.0 },
                      ];
                      form.setFieldsValue({ timeSegmentMaConfig: defaultSegments });
                    }}
                    icon={<ThunderboltOutlined />}
                  >
                    生成默认时间段
                  </Button>
                </div>
              )}
              
              {timeSegmentFields.map((field) => (
                <div key={field.key} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-end', 
                  gap: '16px', 
                  marginBottom: 16, 
                  padding: '12px', 
                  border: '1px solid #e8e8e8', 
                  borderRadius: '6px',
                  backgroundColor: '#fafafa'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>时段开始时间</div>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'timeSegment']} 
                      rules={[
                        { required: true, message: '时段必填' },
                        { 
                          pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                          message: '时间格式错误，请使用HH:mm格式（如09:30）'
                        }
                      ]}
                      style={{ margin: 0 }}
                    >
                      <Input placeholder="09:30" />
                    </Form.Item>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>下方百分比</div>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'maBelowPercent']} 
                      rules={[{ required: true, message: '下方百分比必填' }]}
                      style={{ margin: 0 }}
                    >
                      <InputNumber
                        placeholder="0.5"
                        min={-100}
                        max={100}
                        precision={2}
                        addonAfter="%"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>上方百分比</div>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'maAbovePercent']} 
                      rules={[{ required: true, message: '上方百分比必填' }]}
                      style={{ margin: 0 }}
                    >
                      <InputNumber
                        placeholder="0.1"
                        min={-100}
                        max={100}
                        precision={2}
                        addonAfter="%"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>盈利点</div>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'profitPercent']} 
                      rules={[{ required: true, message: '盈利点必填' }]}
                      style={{ margin: 0 }}
                    >
                      <InputNumber
                        placeholder="1.0"
                        min={-100}
                        max={100}
                        precision={2}
                        addonAfter="%"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => removeTimeSegment(field.name)}
                      size="small"
                    />
                  </div>
                </div>
              ))}
              
              <Button
                type="dashed"
                onClick={() => addTimeSegment({ timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1.0 })}
                icon={<PlusOutlined />}
                style={{ width: '100%' }}
              >
                添加时段
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <div style={{ fontSize: '12px', color: '#666', marginTop: 16, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 4 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>时段配置说明：</div>
        <div>
          • 时段格式：HH:mm（如 09:30），支持00:00-23:59<br/>
          • 下方%：股价低于分时平均线该百分比时买入，可为负数<br/>
          • 上方%：股价高于分时平均线该百分比时买入，可为负数<br/>
          • 盈利点：股价高于分时平均线该百分比时买入，可为负数<br/>
          • 系统会自动检查时间段重复并按时间顺序排序<br/>
          • 默认时间段：09:30(0.5%,0.1%,1.0%), 12:00(1.0%,-0.5%,1.0%), 14:00(1.5%,-1.0%,1.0%)
        </div>
      </div>

      {/* 应用用户配置区域 */}
      <Divider>应用用户配置</Divider>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: 16, padding: 12, backgroundColor: '#fff7e6', borderRadius: 4 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>应用用户说明：</div>
        <div>
          • 选择应用用户：选择将此策略配置应用到哪些用户账户，必须至少选择一个<br/>
          • 单用户最大金额：每个用户账户在此股票上的最大投入金额（美元）<br/>
          • 策略开始时间：策略每日开始生效的时间（美东时间），格式HH:mm<br/>
          • 策略结束时间：策略每日停止生效的时间（美东时间），格式HH:mm<br/>
          • 买入冷却时间：相邻两次买入之间的最小间隔时间（分钟）<br/>
          • 用户股票关系状态：控制用户股票关系的启用状态
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ width: '100%' }}>
          <ProFormSelect
            name="selectedAccounts"
            label="应用用户"
            mode="multiple"
            placeholder="请选择应用用户（可多选）"
            options={accountOptions}
            tooltip="选择将此策略配置应用到哪些用户账户，必须至少选择一个用户"
            rules={[
              { required: true, message: '请至少选择一个用户账户' },
              { type: 'array', min: 1, message: '请至少选择一个用户账户' }
            ]}
          />
          {/* 全选和清空按钮 */}
          <div style={{ marginTop: '8px', marginBottom: '16px' }}>
            <Space>
              <Button 
                size="small" 
                onClick={() => {
                  const allAccountValues = accountOptions.map(option => option.value);
                  form.setFieldsValue({ selectedAccounts: allAccountValues });
                }}
              >
                全选用户
              </Button>
              <Button 
                size="small" 
                onClick={() => {
                  form.setFieldsValue({ selectedAccounts: [] });
                }}
              >
                清空选择
              </Button>
              <span style={{ fontSize: '12px', color: '#666' }}>
                共 {accountOptions.length} 个用户可选
              </span>
            </Space>
          </div>
        </div>

        <div style={{ width: 'calc(50% - 4px)' }}>
          <ProFormDigit
            name="maxAmount"
            label="单用户最大金额"
            tooltip="每个用户账户在此股票上的最大投入金额（美元），与资金百分比互斥，优先使用最大金额"
            min={0}
            initialValue={80000}
            fieldProps={{
              step: 100,
              precision: 0,
              addonAfter: '$',
            }}
          />
        </div>

        <div style={{ width: 'calc(50% - 4px)' }}>
          <ProFormSelect
            name="userStockStatus"
            label="用户股票关系状态"
            options={[
              { label: '启用', value: '1' },
              { label: '禁用', value: '0' },
            ]}
            tooltip="控制用户股票关系的启用状态"
          />
        </div>

        <div style={{ width: 'calc(50% - 4px)' }}>
          <ProFormText
            name="startTime"
            label="策略开始时间"
            tooltip="策略生效的开始时间，格式 HH:mm，例如 09:40"
            placeholder="09:40"
            rules={[
              { required: true, message: '请输入策略开始时间' },
              { 
                pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                message: '时间格式错误，请使用HH:mm格式（如09:40）'
              }
            ]}
          />
        </div>

        <div style={{ width: 'calc(50% - 4px)' }}>
          <ProFormText
            name="endTime"
            label="策略结束时间"
            tooltip="策略生效的结束时间，格式 HH:mm，例如 15:00"
            placeholder="15:00"
            rules={[
              { required: true, message: '请输入策略结束时间' },
              { 
                pattern: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                message: '时间格式错误，请使用HH:mm格式（如15:00）'
              }
            ]}
          />
        </div>

        <div style={{ width: 'calc(50% - 4px)' }}>
          <ProFormDigit
            name="cooldownTime"
            label="买入冷却时间 (分钟)"
            tooltip="策略触发后，再次买入该股票的冷却时间（分钟），例如 30"
            min={0}
            max={1440}
            fieldProps={{
              addonAfter: '分钟',
              style: { width: '100%' },
            }}
            rules={[{ required: true, message: '请输入买入冷却时间' }]}
          />
        </div>
      </div>

      {/* 底部按钮区域 */}
      <div style={{ marginTop: '24px', textAlign: 'left' }}>
        <Button 
          onClick={() => onOpenChange(false)}
          style={{ marginRight: '8px' }}
        >
          取消
        </Button>
        <Button 
          type="primary" 
          onClick={async () => {
            try {
              // 先验证表单
              const values = await form.validateFields();
              console.log('表单验证通过，获取到的值:', JSON.stringify(values, null, 2));
              
              // 手动调用handleSaveStrategyConfig
              const success = await handleSaveStrategyConfig(values);
              if (success) {
                onOpenChange(false);
                form.resetFields();
              }
            } catch (error) {
              console.error('表单验证失败:', error);
            }
          }}
        >
          确定
        </Button>
      </div>
    </ModalForm>
  );
};

export default StrategyConfigModal; 