/* eslint-disable func-names, no-param-reassign */
const HtmlWebpackPlugin = require('html-webpack-plugin')
const path = require('path')
const fs = require('fs')
const rp = require('request-promise')
const hljs = require('highlight.js')

const headers = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
  'Content-Type': 'application/json'
}

function GhPlugins() {}

GhPlugins.prototype.apply = function(compiler) {
  const self = this

  if (compiler.hooks) {
    // webpack 4 support
    compiler.hooks.compilation.tap('HtmlWebpackGhContent', function(
      compilation
    ) {
      if (compilation.hooks.htmlWebpackPluginBeforeHtmlGeneration) {
        compilation.hooks.htmlWebpackPluginBeforeHtmlProcessing.tapAsync(
          'HtmlWebpackGhContent',
          function(data, cb) {
            self.addGhContent(data, cb)
          }
        )
      } else {
        // HtmlWebPackPlugin 4.x
        const hooks = HtmlWebpackPlugin.getHooks(compilation)

        hooks.beforeHtmlProcessing.tapAsync('HtmlWebpackGhContent', function(
          data,
          cb
        ) {
          self.addGhContent(data, cb)
        })
      }
    })
  } else {
    // webpack 3 support
    compiler.plugin('compilation', function(compilation) {
      compilation.plugin('html-webpack-plugin-before-html-processing', function(
        data,
        cb
      ) {
        self.addGhContent(data, cb)
      })
    })
  }
}

GhPlugins.prototype.addGhContent = function(data, cb) {
  let htmlStr = data.html
  const promises = []
  const { options } = data.plugin

  // 替换 ejs 模板中的案例
  const absExamplePath = path.resolve(
    __dirname,
    '../',
    options.examplePath || '.non_existent_path' /* 任何不存在的路径 */
  )
  if (fs.existsSync(absExamplePath)) {
    const exampleStr = fs.readFileSync(absExamplePath, 'utf-8')
    if (path.extname(options.examplePath) !== '.md') {
      htmlStr = htmlStr.replace(/<%= example %>/, exampleStr)
    } else {
      const form = {
        text: exampleStr,
        mode: 'markdown'
      }
      const p = rp({
        method: 'post',
        url: 'https://api.github.com/markdown',
        headers,
        json: true,
        body: form
      }).then(body => {
        htmlStr = htmlStr.replace(
          /<%= example %>/,
          `<div class="markdown-body">${body}</div>`
        )
      })
      promises.push(p)
    }
  } else {
    htmlStr = htmlStr.replace(/<%= example %>/, '')
  }
  // 替换 ejs 模板中的源码
  if (/\$%(.*)%\$/.test(htmlStr)) {
    htmlStr = htmlStr.replace(/\$%(.*)%\$/g, function($0, $1) {
      const codeStr = fs.readFileSync(
        path.resolve(__dirname, '../', $1),
        'utf-8'
      )
      let hjsHtml = hljs.highlightAuto(codeStr).value
      switch (path.extname($1)) {
        case '.html':
          hjsHtml = `<pre><code class="html">${hjsHtml}</code></pre>`
          break
        case '.css':
          hjsHtml = `<pre><code class="css">${hjsHtml}</code></pre>`
          break
        case '.less':
          hjsHtml = `<pre><code class="less">${hjsHtml}</code></pre>`
          break
        case '.js':
          hjsHtml = `<pre><code class="javascript ">${hjsHtml}</code></pre>`
          break
        default:
          hjsHtml = `<pre><code class="plaintext">${hjsHtml}</code></pre>`
      }
      return hjsHtml
    })
  }
  // 替换 ejs 模板中的文档
  const absDocsPath = path.resolve(
    __dirname,
    '../',
    options.docsPath || '.non_existent_path' /* 任何不存在的路径 */
  )
  if (fs.existsSync(absDocsPath)) {
    const docStr = fs.readFileSync(absDocsPath, 'utf-8')
    const form = {
      text: docStr,
      mode: 'markdown'
    }
    const p = rp({
      method: 'post',
      url: 'https://api.github.com/markdown',
      headers,
      json: true,
      body: form
    }).then(body => {
      htmlStr = htmlStr.replace(/<%= documents %>/, body)
    })
    promises.push(p)
  } else {
    htmlStr = htmlStr.replace(/<%= documents %>/, '')
  }

  if (promises.length) {
    Promise.all(promises).then(() => {
      data.html = htmlStr
      cb(null, data)
    })
  } else {
    data.html = htmlStr
    cb(null, data)
  }
}

module.exports = GhPlugins
