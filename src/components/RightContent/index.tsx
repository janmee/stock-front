import { QuestionCircleOutlined } from '@ant-design/icons';
import { SelectLang as UmiSelectLang, setLocale, getLocale } from '@umijs/max';
import React from 'react';

export type SiderTheme = 'light' | 'dark';

export const SelectLang = () => {
  const handleLocaleChange = (key: string) => {
    console.log('语言切换:', key, '当前语言:', getLocale());
    // 先设置语言环境
    setLocale(key, true);
    // 强制刷新页面确保所有组件都正确使用新的语言
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <UmiSelectLang
      style={{
        padding: 4,
      }}
      onItemClick={({ key }) => handleLocaleChange(key)}
    />
  );
};

export const Question = () => {
  return (
    <div
      style={{
        display: 'flex',
        height: 26,
      }}
      onClick={() => {
        window.open('https://pro.ant.design/docs/getting-started');
      }}
    >
      <QuestionCircleOutlined />
    </div>
  );
};
