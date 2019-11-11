const path = require('path')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.conf')

const devConfig = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  devServer: {
    host: 'localhost',
    port: 9000,
    publicPath: 'http://localhost:9000/',
    contentBase: path.resolve(__dirname, '../dist'),
    inline: true,
    open: 'Google Chrome',
    openPage: './',
    index: 'index.htm',
    hot: true,
    hotOnly: true,
    historyApiFallback: true,
    quiet: false,
    stats: 'errors-only'
  }
}

module.exports = merge(baseConfig, devConfig)
