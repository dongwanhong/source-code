/* eslint-disable func-names */
module.exports = function(api) {
  api.cache(true)

  // 插件先于 Preset 执行，顺序由上往下而行
  const plugins = [
    [
      '@babel/plugin-proposal-decorators',
      {
        legacy: true
      }
    ],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-transform-runtime'
  ]
  // Preset 执行顺序相反由下向上而行
  const presets = [
    // 如果 preset 名称的前缀为 babel-preset- 可以省略该前缀
    [
      '@babel/preset-env',
      {
        // we using a .browserslistrc file to specify targets
        useBuiltIns: 'usage',
        corejs: 3
      }
    ]
  ]

  return {
    presets,
    plugins
  }
}
