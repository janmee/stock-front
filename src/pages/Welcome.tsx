import {PageContainer} from '@ant-design/pro-components';
import {useModel} from '@umijs/max';
import {Card, theme} from 'antd';
import React from "react/index";

const Welcome: React.FC = () => {
  const {token} = theme.useToken();
  const {initialState} = useModel('@@initialState');

  const index = 1;
  const tittle = "鸿道智能量化交易系统";
  const href = "https://www.yuque.com/mwangli/ha7323/axga8dz9imansvl4";

  return (
    <PageContainer>
      <Card
        style={{
          borderRadius: 8,
        }}
        bodyStyle={{
          backgroundImage:
            initialState?.settings?.navTheme === 'realDark'
              ? 'background-image: linear-gradient(75deg, #1A1B1F 0%, #191C1F 100%)'
              : 'background-image: linear-gradient(75deg, #FBFDFF 0%, #F5F7FF 100%)',
        }}
      >
        <div
          style={{
            backgroundPosition: '100% -30%',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '274px auto',
            backgroundImage:
              "url('https://gw.alipayobjects.com/mdn/rms_a9745b/afts/img/A*BuFmQqsB2iAAAAAAAAAAAAAAARQnAQ')",
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div
              style={{
                backgroundColor: token.colorBgContainer,
                boxShadow: token.boxShadow,
                borderRadius: '8px',
                fontSize: '14px',
                color: token.colorTextSecondary,
                lineHeight: '22px',
                padding: '16px 19px',
                minWidth: '220px',
                flex: 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    lineHeight: '22px',
                    backgroundSize: '100%',
                    textAlign: 'center',
                    padding: '8px 16px 16px 12px',
                    color: '#FFF',
                    fontWeight: 'bold',
                    backgroundImage:
                      "url('https://gw.alipayobjects.com/zos/bmw-prod/daaf8d50-8e6d-4251-905d-676a24ddfa12.svg')",
                  }}
                >
                  {index}
                </div>
                <div
                  style={{
                    fontSize: '16px',
                    color: token.colorText,
                    paddingBottom: 8,
                  }}
                >
                  {tittle}
                </div>
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: token.colorTextSecondary,
                  textAlign: 'justify',
                  lineHeight: '22px',
                  marginBottom: 8,
                }}
              >
                <p
                  style={{
                    fontSize: '14px',
                    color: token.colorTextSecondary,
                    lineHeight: '22px',
                    marginTop: 16,
                    marginBottom: 32,
                    width: '95%',
                  }}
                  hidden={false}
                >
                  <div style={{
                    fontWeight: 'bolder'
                  }}>
                    鸿道智能量化交易系统是一款自动化股票交易管理软件，可以按照自定义交易策略，进行自动化的股票买卖交易, 也可以查看股票历史价格，实时价格，买卖记录和相关报表数据<br/>
                  </div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    marginTop: '16px'
                  }}>
                    开发日志:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      // gap: 16,
                    }}
                  >
                    <div style={{
                      fontSize: '14px',
                      color: token.colorTextSecondary,
                      lineHeight: '22px',
                      marginTop: 16,
                      marginBottom: 16,
                      width: '50%',
                    }}>
                      <span>2025-03-16</span> <br/>
                      1. 周期性定投 <br/>
                      2. 股票下跌买入策略 <br/>
                      3. 自动跟单
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: token.colorTextSecondary,
                      lineHeight: '22px',
                      marginTop: 16,
                      marginBottom: 32,
                      width: '40%',
                    }}>
                      
                    </div>

                  </div>
                </p>
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: token.colorTextSecondary,
                  textAlign: 'justify',
                  lineHeight: '22px',
                  marginBottom: 8,
                }}
              >
                {""}
              </div>
              {/* <a href={href} target="_blank" rel="noreferrer">
                了解更多 {'>'}
              </a> */}
            </div>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default Welcome;
