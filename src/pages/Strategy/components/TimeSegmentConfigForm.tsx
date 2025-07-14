import React from 'react';
import { Form, Input, InputNumber, Button, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';

interface TimeSegmentConfigFormProps {
  value?: any[];
  onChange?: (value: any[]) => void;
  fieldName?: string;
  form?: any;
  onGenerateDefault?: () => void;
}

const TimeSegmentConfigForm: React.FC<TimeSegmentConfigFormProps> = ({
  value,
  onChange,
  fieldName = 'timeSegmentMaConfigInput',
  form,
  onGenerateDefault,
}) => {
  // 生成默认时段配置
  const generateDefaultTimeSegments = () => {
    const defaultSegments = [
      { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 1.0 },
      { timeSegment: '12:00', maBelowPercent: 1.0, maAbovePercent: -0.5, profitPercent: 1.0 },
      { timeSegment: '14:00', maBelowPercent: 1.5, maAbovePercent: -1.0, profitPercent: 1.0 },
    ];
    
    if (form) {
      form.setFieldsValue({
        [fieldName]: defaultSegments
      });
    }
    
    if (onGenerateDefault) {
      onGenerateDefault();
    }
  };

  return (
    <Form.Item
      label="时段配置"
      tooltip="不同时段的分时平均线买入配置，可动态增删"
      required
    >
      <Form.List name={fieldName}>
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
                  onClick={generateDefaultTimeSegments}
                  icon={<ThunderboltOutlined />}
                >
                  生成默认时间段
                </Button>
              </div>
            )}
            
            {timeSegmentFields.map((field) => (
              <div key={field.key} style={{ 
                marginBottom: 16, 
                padding: '12px', 
                border: '1px solid #e8e8e8', 
                borderRadius: '6px',
                backgroundColor: '#fafafa'
              }}>
                <Row gutter={16} align="bottom">
                  <Col span={6}>
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
                  </Col>
                  <Col span={5}>
                    <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>下方百分比</div>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'maBelowPercent']} 
                      rules={[{ required: true, message: '下方百分比必填' }]}
                      style={{ margin: 0 }}
                    >
                      <InputNumber 
                        min={-100} 
                        max={100} 
                        precision={2} 
                        addonAfter="%" 
                        placeholder="0.50" 
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>上方百分比</div>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'maAbovePercent']} 
                      rules={[{ required: true, message: '上方百分比必填' }]}
                      style={{ margin: 0 }}
                    >
                      <InputNumber 
                        min={-100} 
                        max={100} 
                        precision={2} 
                        addonAfter="%" 
                        placeholder="0.10" 
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={5}>
                    <div style={{ marginBottom: 4, fontSize: '12px', color: '#666' }}>盈利点</div>
                    <Form.Item 
                      {...field} 
                      name={[field.name, 'profitPercent']} 
                      rules={[{ required: true, message: '盈利点必填' }]}
                      style={{ margin: 0 }}
                    >
                      <InputNumber 
                        min={-100} 
                        max={100} 
                        precision={2} 
                        addonAfter="%" 
                        placeholder="0.10" 
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={3}>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '32px' }}>
                      <MinusCircleOutlined 
                        onClick={() => removeTimeSegment(field.name)}
                        style={{ color: '#ff4d4f', fontSize: '16px', cursor: 'pointer' }}
                      />
                    </div>
                  </Col>
                </Row>
              </div>
            ))}
            
            {timeSegmentFields.length > 0 && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button 
                  type="dashed" 
                  onClick={() => {
                    const newItem = { timeSegment: '09:30', maBelowPercent: 0.5, maAbovePercent: 0.1, profitPercent: 0.1 };
                    addTimeSegment(newItem);
                  }} 
                  icon={<PlusOutlined />}
                  style={{ flex: 1 }}
                >
                  添加时段
                </Button>
              </div>
            )}
          </>
        )}
      </Form.List>
      
      <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f8ff', borderRadius: 4 }}>
        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>说明：</div>
        <div style={{ fontSize: '12px', color: '#666' }}>
          • 时段格式：HH:mm（如 09:30），支持00:00-23:59<br/>
          • 下方%：股价低于分时平均线该百分比时买入，可为负数<br/>
          • 上方%：股价高于分时平均线该百分比时买入，可为负数<br/>
          • 盈利点：股价高于分时平均线该百分比时买入，可为负数<br/>
          • 系统会自动检查时间段重复并按时间顺序排序<br/>
          • 默认时间段：09:30(0.5%,0.1%,0.1%), 12:00(1.0%,-0.5%,-0.5%), 14:00(1.5%,-1.0%,-1.0%)
        </div>
      </div>
    </Form.Item>
  );
};

export default TimeSegmentConfigForm; 