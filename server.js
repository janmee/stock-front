const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const bodyParser = require('body-parser');
const proxyConfig = require('./config/proxy');

const app = express();

// 获取当前环境的代理配置
const REACT_APP_ENV = process.env.REACT_APP_ENV || 'dev';
const currentProxy = proxyConfig[REACT_APP_ENV];

// 添加请求体解析中间件
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 调试中间件 - 记录所有请求
app.use((req, res, next) => {
  console.log('\n=== 收到新请求 ===');
  console.log('请求URL:', req.url);
  console.log('请求方法:', req.method);
  console.log('请求头:', JSON.stringify(req.headers, null, 2));
  console.log('请求体:', JSON.stringify(req.body, null, 2));
  console.log('==================');
  next();
});

// 设置API代理
Object.entries(currentProxy).forEach(([path, proxyOptions]) => {
  // 合并代理配置
  const options = Object.assign({}, proxyOptions, {
    logLevel: 'debug',
    changeOrigin: true,
    secure: false,
    ws: true,
    xfwd: true,
    pathRewrite: null,
    onProxyReq: (proxyReq, req, res) => {
      console.log('\n=== 代理请求信息 ===');
      console.log('原始URL:', req.url);
      console.log('代理URL:', proxyReq.path);
      console.log('代理方法:', proxyReq.method);
      console.log('代理请求头:', JSON.stringify(proxyReq.getHeaders(), null, 2));

      // 处理 POST 请求体
      if (req.method === 'POST' && req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
        console.log('代理请求体:', bodyData);
      }
      console.log('===================');
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log('\n=== 代理响应信息 ===');
      console.log('响应状态码:', proxyRes.statusCode);
      console.log('响应头:', JSON.stringify(proxyRes.headers, null, 2));

      // 记录响应体
      let responseBody = '';
      proxyRes.on('data', chunk => {
        responseBody += chunk;
      });
      proxyRes.on('end', () => {
        console.log('响应体:', responseBody);
        console.log('===================');
      });

      // 添加CORS头
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    },
    onError: (err, req, res) => {
      console.error('\n=== 代理错误 ===');
      console.error('错误信息:', err);
      console.error('===================');
      res.status(500).send('代理服务器错误');
    }
  });
  
  // 使用正则表达式匹配路径
  const pathRegex = new RegExp('^' + path);
  app.use((req, res, next) => {
    if (pathRegex.test(req.url)) {
      console.log('\n=== 路径匹配成功 ===');
      console.log('匹配模式:', pathRegex);
      console.log('请求路径:', req.url);
      console.log('===================');
      createProxyMiddleware(options)(req, res, next);
    } else {
      next();
    }
  });
});

// 处理静态文件
app.use(express.static(path.join(__dirname, 'dist')));

// 处理所有其他请求
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n=== 服务器启动 ===`);
  console.log(`前端服务运行在: http://localhost:${PORT}`);
  console.log(`环境: ${REACT_APP_ENV}`);
  console.log(`代理配置:`, JSON.stringify(currentProxy, null, 2));
  console.log(`=================\n`);
});