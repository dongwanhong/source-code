module.exports = [
  {
    title: '原生 JavaScript 实现滑块拖动验证',
    links: [
      {
        rel: 'stylesheet',
        href:
          'https://cdn.bootcss.com/github-markdown-css/3.0.1/github-markdown.min.css'
      }
    ],
    buttons: ['示例', '文档', '源码'],
    // 相对项目根目录指定示例 HTML 代码的文件所在
    examplePath: 'src/pages/slide-unlock/example.html',
    // 相对项目根目录指定示例文档的文件所在
    docsPath: 'docs/slide-unlock/README.md',
    cards: [
      // {
      //   name: 'HTML',
      //   path: 'docs/slide-unlock/core.html'
      // },
      {
        name: 'LESS',
        path: 'docs/slide-unlock/core.less'
      },
      {
        name: 'JavaScript',
        // 指定源码的 markdown 文件所在
        // 相对项目根目录指定路径
        path: 'docs/slide-unlock/core.js'
      }
    ],
    scripts: [
      // {
      //   type: 'text/javascript',
      //   src: 'https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js'
      // }
    ]
  }
]
