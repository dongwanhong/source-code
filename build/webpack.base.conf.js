const webpack = require('webpack')
const path = require('path')
const glob = require('glob')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const devMode = process.env.NODE_ENV !== 'production'

function resolve(p) {
  return path.resolve(__dirname, `../${p}`)
}

function getEntries() {
  // |- src
  // |- pages
  // |---- about
  // |-------- index.html
  // |-------- main.js
  // |---- other
  // |-------- index.html
  // |-------- main.js
  // |- index.html
  // |- favicon.ico
  const htmlCompressConf = {
    collapseWhitespace: true,
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    useShortDoctype: true
  }
  const htmlPath = 'src/pages/**/main.js'
  // (\/|\\\\) 兼容 windows 和 mac 系统目录路径的不同写法
  const files = glob.sync(htmlPath)
  // 首页
  const entryMap = {
    main: resolve('src/index.js')
  }
  const htmlPluginArray = [
    new HtmlWebpackPlugin({
      minify: !devMode ? htmlCompressConf : false,
      filename: 'index.html',
      template: resolve('src/index.html'),
      favicon: resolve('src/favicon.ico'),
      chunks: ['main']
    })
  ]

  files.forEach(file => {
    const name = path
      .dirname(file)
      .split('/')
      .pop()

    entryMap[name] = resolve(file)
    htmlPluginArray.push(
      new HtmlWebpackPlugin({
        minify: !devMode ? htmlCompressConf : false,
        filename: `./${name}/index.html`,
        template: resolve(`./${path.dirname(file)}/index.html`),
        favicon: resolve('src/favicon.ico'),
        chunks: [name]
      })
    )
  })

  return { entryMap, htmlPluginArray }
}

const { entryMap, htmlPluginArray } = getEntries()
const rules = [
  {
    test: /\.(le|c)ss$/,
    use: [
      devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
      'css-loader',
      'postcss-loader',
      'less-loader'
    ]
  },
  {
    test: /\.m?js$/,
    exclude: /(node_modules|bower_components)/,
    use: {
      loader: 'babel-loader'
    }
  },
  {
    test: /\.(png|svg|jpg|jpeg|gif)$/,
    use: [
      {
        loader: 'url-loader',
        options: {
          limit: 8192,
          name: 'images/[name].[ext]',
          fallback: 'file-loader'
        }
      }
    ]
  }
]

module.exports = {
  entry: entryMap,
  output: {
    path: resolve('dist'),
    filename: devMode ? '[name]/main.js' : '[name]/main.[chunkhash:8].js',
    chunkFilename: devMode
      ? '[name]/[name].min.js'
      : '[name]/[name].[chunkhash:8].min.js'
  },
  module: {
    rules
  },
  plugins: [
    new webpack.ProgressPlugin(),
    ...htmlPluginArray,
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      filename: devMode ? '[name]/main.css' : '[name]/main.[contenthash].css',
      chunkFilename: devMode
        ? '[name]/[id].css'
        : '[name]/[id].[contenthash].css'
    })
  ]
}
