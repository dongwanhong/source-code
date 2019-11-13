const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserJSPlugin = require('terser-webpack-plugin')
const glob = require('glob-all')
const PurifyCSSPlugin = require('purifycss-webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const baseConfig = require('./webpack.base.conf')

const devMode = process.env.NODE_ENV !== 'production'

const prodConfig = {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimizer: [new OptimizeCSSAssetsPlugin(), new TerserJSPlugin()],
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'async',
      name: true,
      automaticNameDelimiter: '.',
      // the priority is maxInitialRequest/maxAsyncRequests < maxSize < minSize
      minSize: 0,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      cacheGroups: {
        // 缓存组，会继承 splitChunks 的配置
        common: {
          priority: -20,
          chunks: 'all',
          minChunks: 2,
          reuseExistingChunk: true // 如果当前代码块包含的模块已经有了，就不在产生一个新的代码块
        }
      }
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new PurifyCSSPlugin({
      // Give paths to parse for rules. These should be absolute
      paths: glob.sync([
        path.join(__dirname, '../src/**/*.html'),
        path.join(__dirname, '../src/**/*.js')
      ])
    }),
    new webpack.HashedModuleIdsPlugin({
      hashFunction: 'md4', // 指定 hash 算法
      hashDigest: 'base64', // 生成哈希时使用的编码
      hashDigestLength: 4 // 生成哈希值的长度
    })
  ]
}

module.exports = merge(baseConfig, devMode ? {} : prodConfig)
