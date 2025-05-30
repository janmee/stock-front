/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  // 如果需要自定义本地开发服务器  请取消注释按需调整
  dev: {
    '/api/': {
      // 要代理的地址
      target: 'http://localhost:8080',
      // 配置了这个可以从 http 代理到 https
      // 依赖 origin 的功能可能需要这个，比如 cookie
      changeOrigin: true,
      // 移除/api前缀
      pathRewrite: { '^/api': '/api' },
    },
  },

  /**
   * 在生产环境下使用的代理配置
   */
  pre: {
    '/api/': {
      // 生产环境API地址
      target: 'http://localhost:8080',
      changeOrigin: true,
      // 移除/api前缀
      pathRewrite: { '^/api': '/api' },
    },
  },
};
