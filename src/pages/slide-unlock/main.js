import utils from '@utils'
import SlideUnlock from './js/core'
import './styles/index.less'

const slider = new SlideUnlock('#slide-wrapper')
slider.init()
utils.bindEvents('click', slider.reset.bind(slider), utils.$('button.reset'))
utils.createTab()
utils.createCard()
