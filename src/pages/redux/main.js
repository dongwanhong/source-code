import * as redux from './js/core'
import utils from '@utils'
import '@styles/index.less'

utils.createTab()
utils.createCard()
;(function IIFE(global = {}) {
  Object.assign(global, redux)
})(window)
