module.exports = {
  transpileDependencies: [],
  configureWebpack: {
    resolve: {
      alias: {
        '@': require('path').resolve(__dirname, 'src')
      }
    }
  },
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  assetsDir: 'assets',
  devServer: {
    proxy: {
      '/api': {
        target: process.env.VUE_APP_API_URL || 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  productionSourceMap: false,
  chainWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimize(true);
    }
  }
}
