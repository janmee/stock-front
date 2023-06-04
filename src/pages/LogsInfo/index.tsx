import {PageContainer,} from '@ant-design/pro-components';
import React, {useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {useModel} from "@umijs/max";


/**
 * @en-US Add node
 * @zh-CN 添加节点
 * @param fields
 */
const LogsInfo: React.FC = () => {

    /**
     * @en-US International configuration
     * @zh-CN 国际化配置
     * */
      // 日志信息
      // const [logs, setLogs] = useState<string>('');
    const [init, setInit] = useState<boolean>(true);

    // const [ws, setWS] = useState<any>(null);

    const {initialState, setInitialState} = useModel('@@initialState');

    // const getWS = () => {
    // let connectedLo: boolean = localStorage.getItem("connected");
    // initialState?.
    //   if (!ws) {
    //
    //     const localServer = "localhost:8080";
    //     const remoteServer = "124.220.36.95:8080";
    //     // console.log(JSON.stringify(process.env))
    //     const server = process.env.NODE_ENV == 'production' ? remoteServer : localServer;
    //     const webSocket = new WebSocket(`ws://${server}/webSocket`);
    //
    //     webSocket.onopen = () => {
    //       console.log('连接建立成功')
    //     }
    //
    //     webSocket.onclose = () => {
    //       console.log('连接关闭成功')
    //     }
    //
    //     webSocket.onmessage = (message: any) => {
    //       // console.log(message.data)
    //       setLogs(message.data)
    //
    //     }
    //
    //     setWS(webSocket);
    //     setInitialState((s) => ({
    //       ...s,
    //       ws: webSocket,
    //     }));
    //
    //   }
    //
    // }
    //
    // getWS()

    return (
      <PageContainer>
        <CodeMirror
          editable={false}
          readOnly={true}
          theme={"dark"}
          value={initialState?.logs}
          height="1000px"

          // extensions={[javascript({jsx: true})]}
          // onChange={onChange}
          onScroll={(s) => {
            console.log(s)
          }}
          onUpdate={(viewUpdate) => {
            let scrollDOM = viewUpdate.view.scrollDOM;
            let height = scrollDOM.scrollHeight;
            let top = scrollDOM.scrollTop + 1020;
            console.log(top)
            console.log(scrollDOM.scrollHeight)
            if (init || top >= scrollDOM.scrollHeight) {
              scrollDOM.scrollTop = scrollDOM.scrollHeight;
              setInit(false);
            }
          }}
        />

        {/*<CodeMirror2*/}
        {/*  value='<h1>I ♥ react-codemirror2</h1>'*/}
        {/*  options={{*/}
        {/*    mode: 'xml',*/}
        {/*    theme: 'material',*/}
        {/*    lineNumbers: true*/}
        {/*  }}*/}
        {/*  onChange={(editor, data, value) => {*/}
        {/*  }}*/}
        {/*/>*/}
      </PageContainer>
    );
  }
;

export default LogsInfo;
