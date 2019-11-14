import './index.less'

/* eslint-disable global-require */
if (process.env.NODE_ENV !== 'production') {
  // module.hot && module.hot.accept() // 无法共存
  require('./index.html')
}
/* eslint-enable global-require */
