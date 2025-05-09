import { QuestionCircleOutlined } from '@ant-design/icons';
// @ts-ignore  忽略类型检查
import { SelectLang as UmiSelectLang, setLocale, getLocale } from '@umijs/max';
import React from 'react';

export type SiderTheme = 'light' | 'dark';

export const SelectLang = () => {
  const handleLocaleChange = (key: string) => {
    console.log('语言切换被触发:', key, '当前语言:', getLocale());
    
    try {
      // 保存语言选择到本地存储
      localStorage.setItem('umi_locale', key);
      
      // 设置语言环境
      setLocale(key, false);
      
      // 延迟刷新页面以确保语言设置已应用
      setTimeout(() => {
        console.log('执行页面刷新...');
        window.location.reload();
      }, 200);
    } catch (error) {
      console.error('切换语言时出错:', error);
    }
  };

  return (
    // @ts-ignore 忽略类型检查
    <UmiSelectLang
      style={{
        padding: 4,
      }}
      onItemClick={(params) => {
        console.log('语言项被点击:', params);
        // @ts-ignore
        const key = params?.key;
        if (key) {
          handleLocaleChange(key);
        }
      }}
      // 只显示中文和英文
      postLocalesData={(oldLangMenu) => {
        // 打印当前可用的语言菜单以便调试
        console.log('可用语言菜单:', oldLangMenu);
        
        // 确保menu项有数据
        if (!oldLangMenu || oldLangMenu.length === 0) {
          console.log('提供默认语言菜单');
          return [
            { label: '简体中文', id: 'zh-CN', lang: 'zh-CN', icon: '🇨🇳' },
            { label: 'English', id: 'en-US', lang: 'en-US', icon: '🇺🇸' }
          ];
        }
        
        // 只保留中文和英文
        // @ts-ignore 忽略类型检查
        const filtered = oldLangMenu.filter((lang) => {
          // @ts-ignore
          const langKey = lang.id || lang.key || lang.lang;
          return langKey === 'zh-CN' || langKey === 'en-US';
        });
        
        console.log('过滤后的语言菜单:', filtered);
        return filtered;
      }}
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
