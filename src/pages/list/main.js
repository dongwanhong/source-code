import '@styles/index.less'
import './index.less'

/* eslint-disable global-require */
if (process.env.NODE_ENV !== 'production') {
  require('./index.html')
}
/* eslint-enable global-require */
