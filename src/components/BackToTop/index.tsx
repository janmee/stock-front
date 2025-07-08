import React, { useState, useEffect, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import { UpOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import './index.less';

const BackToTop: React.FC = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const intl = useIntl();

  const scrollToTop = useCallback(() => {
    if (isScrolling) return; // 防止重复点击
    
    setIsScrolling(true);
    
    // 使用浏览器原生的平滑滚动
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // 设置一个定时器来重置滚动状态
    setTimeout(() => {
      setIsScrolling(false);
    }, 1000); // 1秒后重置状态
  }, [isScrolling]);

  return (
    <div className="back-to-top">
      <Tooltip 
        title={intl.formatMessage({
          id: 'component.backToTop.tooltip',
          defaultMessage: '回到顶部'
        })}
        placement="left"
      >
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={<UpOutlined />}
          onClick={scrollToTop}
          className="back-to-top-button"
          loading={isScrolling}
        />
      </Tooltip>
    </div>
  );
};

export default BackToTop; 