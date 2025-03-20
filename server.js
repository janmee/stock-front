const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const bodyParser = require('body-parser');
const proxyConfig = require('./config/proxy');

const app = express();

// 获取当前环境的代理配置
const REACT_APP_ENV = process.env.REACT_APP_ENV || 'pre';
const currentProxy = proxyConfig[REACT_APP_ENV];

// 确保代理配置存在
if (!currentProxy) {
  console.error(`未找到环境 ${REACT_APP_ENV} 的代理配置`);
  process.exit(1);
}

// 静态资源服务必须在API代理之前
app.use(express.static(path.join(__dirname, 'dist')));


// 设置API代理
Object.entries(currentProxy).forEach(([path, proxyOptions]) => {
  // 合并代理配置
  const options = Object.assign({}, proxyOptions, {
    logLevel: 'debug',
    changeOrigin: true,
    secure: false,
    ws: true,
    xfwd: true,
    timeout: 5000, // 设置超时时间为5秒
    // pathRewrite: { '^/api': '' }, // 移除/api前缀
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
      console.log('目标地址:', proxyOptions.target + req.url);
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