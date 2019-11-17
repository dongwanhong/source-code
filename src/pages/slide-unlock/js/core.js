import utils from '../../../utils/index'

/**
 * Class implement slide verification.
 * @example
 * new SlideUnlock().init()
 */
class SlideUnlock {
  /**
   * 初始化滑块，处理配置
   * @param {Element} el 挂载的元素
   * @param {object} options 配置项
   */
  constructor(el = 'body', options = {}) {
    this.$el = utils.$(el)
    this.$$isSuccess = false
    this.$options = {
      tip: '请按住滑块，拖动到最右边',
      unlockText: '验证成功',
      duration: 500,
      ...options
    }
  }

  /**
   * @public
   * @method
   * @name init
   * @description 创建滑块的 DOM 结构，并添加鼠标在滑块上按下的监听器
   * @returns {void}
   */
  init() {
    this.$$root = utils.h('div', { class: 'slide-track' })
    this.$$bg = this.$$root.appendChild(utils.h('div', { class: 'slide-bg' }))
    this.$$block = this.$$root.appendChild(
      utils.h('div', { class: 'slide-block' })
    )
    this.$$text = this.$$root.appendChild(
      utils.h('p', { class: 'slide-text' }, this.$options.tip)
    )
    this.$el.insertBefore(this.$$root, this.$el.firstChild)
    this._bindEvents()
  }

  /**
   * @private
   * @method
   * @name _bindEvents
   * @description 绑定鼠标的按下和松开事件
   * @returns {void}
   */
  _bindEvents() {
    utils.bindEvents(
      'mousedown touchstart',
      (this.$$handleMouseDown = this._handleMouseDown.bind(this)),
      this.$$block
    )
    utils.bindEvents(
      'mouseup touchend',
      (this.$$handleMouseUp = this._handleMouseUp.bind(this)),
      document
    )
  }

  /**
   * @private
   * @method
   * @name _handleMouseDown
   * @description 滑块上鼠标按下的监听器，主要记录鼠标的横坐标并指定滑块滑动的监听器
   * @param {MouseEvent} e 一个基于 Event 的对象
   * @returns {void}
   */
  _handleMouseDown(e) {
    const downx = e.clientX || e.changedTouches[0].clientX

    if (e.cancelable) {
      e.preventDefault() // 阻止默认行为
    }

    if (this.$$isSuccess) {
      return
    }

    // 取消在手动滑动过程中的动画效果
    this.$$bg.style.transition = ''
    this.$$block.style.transition = ''

    utils.bindEvents(
      'mousemove touchmove',
      (this.$$handleMouseMove = utils.throttle(
        this._handleMouseMove,
        this,
        undefined,
        downx
      )),
      this.$$block
    )
  }

  /**
   * @private
   * @method
   * @name _handleMouseMove
   * @description 滑块滑动的监听器，主要更新滑块位置和背景元素的宽度
   * @param {MouseEvent} e 一个基于 Event 的对象
   * @returns {void}
   */
  _handleMouseMove(downx, e) {
    const info = this.$$block.getBoundingClientRect()
    const x = e.clientX || e.changedTouches[0].clientX
    const y = e.clientY
    const x1 = info.left
    const y1 = info.top
    const x2 = info.right
    const y2 = info.bottom
    const moveX = x - downx

    if (this.$$isSuccess) {
      return
    }
    if (moveX < 0) {
      return
    }
    if (x < x1 || x > x2 || y < y1 || y > y2) {
      // 当鼠标移开滑块时取消移动
      return
    }

    this.$$block.style.left = `${moveX}px`
    this.$$bg.style.width = `${moveX}px`

    if (moveX >= this.$$root.offsetWidth + x1 - x2) {
      this.$$isSuccess = true
      this.$$text.textContent = this.$options.unlockText
      this.$$text.style.cssText = `color: #fff; left: 0; right: ${this.$$block.offsetWidth}px;`
      this.$$block.classList.add('success')
      if (utils.isFunction(this.$options.cb)) {
        this.$options.cb.call(this)
      }
    }
  }

  /**
   * @private
   * @method
   * @name _handleMouseUp
   * @description 鼠标松开的监听器，主要用于重置
   * @param {MouseEvent} e 一个基于 Event 的对象
   * @returns {void}
   */
  _handleMouseUp() {
    clearTimeout(this.$$tId)
    utils.unbindEvents(
      'mousemove touchmove',
      this.$$handleMouseMove,
      this.$$block
    )

    if (this.$$isSuccess) {
      utils.unbindEvents('mouseup touchend', this.$$handleMouseUp, document)
      utils.unbindEvents(
        'mousedown touchstart',
        this.$$handleMouseDown,
        this.$$block
      )
      return
    }

    // 给重置过程添加动画效果
    this.$$bg.style.cssText = `transition: width ${this.$options.duration}ms ease; width: 0;`
    this.$$block.style.cssText = `transition: left ${this.$options.duration}ms ease; left: 0;`
  }

  /**
   * @public
   * @method
   * @name isSuccess
   * @description 返回当前滑块的状态
   * @returns {boolean}
   */
  isSuccess() {
    return this.$$isSuccess
  }

  /**
   * @public
   * @method
   * @name reset
   * @description 重置滑块的状态
   * @returns {void}
   */
  reset() {
    if (!this.$$isSuccess) {
      return
    }
    this.$$isSuccess = false
    this.$$bg.style.cssText = `transition: width ${this.$options.duration}ms ease; width: 0;`
    this.$$block.style.cssText = `transition: left ${this.$options.duration}ms ease; left: 0;`
    this.$$text.style.cssText = `color: #5f5f5f; left: ${this.$$block.offsetWidth}px; right: 0;`
    this.$$text.textContent = this.$options.tip
    this.$$block.classList.remove('success')
    this._bindEvents()
  }
}

export default SlideUnlock
