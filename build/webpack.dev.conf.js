const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.conf')

const devConfig = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    host: 'localhost',
    port: 9000,
    publicPath: 'http://localhost:9000/',
    // contentBase: path.resolve(__dirname, '../src'),
    inline: true,
    open: 'Google Chrome',
    openPage: './',
    index: 'index.html',
    hot: true,
    // hotOnly: true,
    // 当 devServer.contentBase 选项下的文件改变时，会触发一次完整的页面重载
    // watchContentBase: true,
    historyApiFallback: true,
    quiet: false,
    stats: 'errors-only'
  }
}

module.exports = merge(baseConfig, devConfig)
