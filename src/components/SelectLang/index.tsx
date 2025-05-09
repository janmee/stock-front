import React, { useEffect, useState } from 'react';
import { setLocale, getLocale } from '@umijs/max';
import { Menu, Dropdown } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';

export interface HeaderDropdownProps {
  overlayClassName?: string;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
}

const SelectLang: React.FC = () => {
  const [currentLang, setCurrentLang] = useState(getLocale());

  useEffect(() => {
    // 组件挂载时获取当前语言
    setCurrentLang(getLocale());
  }, []);

  const changeLang = ({ key }: { key: string }): void => {
    
    try {
      setLocale(key, false);
      localStorage.setItem('umi_locale', key);
      
      // 强制刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('切换语言出错:', error);
    }
  };

  const langMenu = (
    <Menu onClick={changeLang} selectedKeys={[currentLang]}>
      <Menu.Item key="zh-CN">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span role="img" aria-label="简体中文" style={{ marginRight: 8 }}>
            🇨🇳
          </span>
          简体中文
        </div>
      </Menu.Item>
      <Menu.Item key="en-US">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span role="img" aria-label="English" style={{ marginRight: 8 }}>
            🇺🇸
          </span>
          English
        </div>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown overlay={langMenu} placement="bottomRight">
      <span style={{ padding: 12, cursor: 'pointer' }}>
        <GlobalOutlined style={{ fontSize: 18 }} />
      </span>
    </Dropdown>
  );
};

export default SelectLang; 