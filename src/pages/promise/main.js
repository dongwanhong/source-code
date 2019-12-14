import _Promise from './js/core'
import utils from '@utils'
import '@styles/index.less'

utils.createTab()
utils.createCard()
;(function IIFE(global = {}) {
  global._Promise = _Promise
})(window)
