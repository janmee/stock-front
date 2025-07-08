import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import { useIntl, getLocale } from '@umijs/max';
import React, { useEffect, useState } from 'react';

const Footer: React.FC = () => {
  const intl = useIntl();
  const [currentLocale, setCurrentLocale] = useState(getLocale());
  
  useEffect(() => {
    // 监听语言变化
    setCurrentLocale(getLocale());
  }, []);
  
  const defaultMessage = intl.formatMessage({
    id: 'app.copyright.produced',
    defaultMessage: 'janmee.online',
  });

  const currentYear = new Date().getFullYear();

  return (
    <DefaultFooter
      style={{
        background: 'none',
      }}
      copyright={`${currentYear} ${defaultMessage}`}
      links={[
        {
          key: 'Stock-Trading System',
          title: `Stock-Trading System v3.1.1 (${currentLocale})`,
          href: 'https://github.com/mwangli',
          blankTarget: true,
        },
        // {
        //   key: 'github',
        //   title: <GithubOutlined />,
        //   href: 'https://github.com/mwangli',
        //   blankTarget: true,
        // },
        // {
        //   key: 'mwangli',
        //   title: 'mwangli',
        //   href: 'https://github.com/mwangli',
        //   blankTarget: true,
        // },
        // {
        //   key: 'beian',
        //   title: '湘ICP备2024059202号',
        //   href: 'https://beian.miit.gov.cn/',
        //   blankTarget: true,
        // },

      ]}
    />
  );
};

export default Footer;
