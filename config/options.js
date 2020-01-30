const defaultOptions = {
  title: '案例分享',
  links: [
    {
      rel: 'stylesheet',
      href:
        'https://cdn.bootcss.com/github-markdown-css/3.0.1/github-markdown.min.css'
    }
  ],
  // 导航按钮列表
  buttons: ['示例', '文档', '源码'],
  // 相对项目根目录指定示例 HTML 代码的文件所在
  examplePath: 'docs/__article__/example.md',
  // 相对项目根目录指定示例文档的文件所在
  docsPath: 'docs/__article__/README.md',
  // 源码块
  cards: [
    /*
    {
      // 块标题
      name: 'HTML',
      path: 'docs/__article__/core.html'
    },
    {
      name: 'LESS',
      path: 'docs/__article__/core.less'
    },
    {
      name: 'JavaScript',
      // 指定源码的 markdown 文件所在
      // 相对项目根目录指定路径
      path: 'docs/__article__/core.js'
    }
    */
  ],
  scripts: [
    // {
    //   type: 'text/javascript',
    //   src: 'https://cdn.bootcss.com/highlight.js/9.15.10/highlight.min.js'
    // }
  ]
}
const strats = Object.create(null)

/**
 * 去重
 */
function dedupeHooks(hooks) {
  const res = []
  for (let i = 0; i < hooks.length; i++) {
    if (res.indexOf(hooks[i]) === -1) {
      res.push(hooks[i])
    }
  }
  return res
}

const defaultStrat = (parentVal, childVal) => {
  return childVal === undefined ? parentVal : childVal
}
const mergeArr = (parentVal, childVal) => {
  if (childVal && typeof childVal === 'object' && childVal.__reset__) {
    // 提供直接覆盖的机会 { __reset__: true, value: options }
    return childVal.value
  }

  /* eslint-disable no-nested-ternary */
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
      ? childVal
      : [childVal]
    : parentVal

  return res ? dedupeHooks(res) : res
}
const mergeString = (parentVal, childVal, article) => {
  if (childVal) {
    return childVal
  }

  return parentVal.replace('__article__', article)
}

;[('links', 'scripts', 'cards', 'buttons')].forEach(name => {
  strats[name] = mergeArr
})
;['examplePath', 'docsPath'].forEach(name => {
  strats[name] = mergeString
})

function mergeOptions(parent, child, article) {
  const options = {}

  function mergeField(key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], article)
  }

  Object.keys(parent).forEach(key => mergeField(key))

  return options
}

/**
 * @param {*} articles 关于文章列表的配置项
 */
function getOptions(articles) {
  const retOptions = Object.create(null)
  Object.entries(articles).forEach(([article, options]) => {
    retOptions[article] = mergeOptions(defaultOptions, options, article)
  })

  return retOptions
}

module.exports = {
  getOptions
}
