import utils from '@utils'

/**
 * 创建一个基础模块
 * @class
 */
class Module {
  constructor(rawModule) {
    const rawState = rawModule.state

    this._children = Object.create(null)
    // 存储开发者传递的源模块对象
    this._rawModule = rawModule
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }

  /**
   * @public
   * @method
   * @name addChild
   * @description 添加子模块
   * @param {string} key 子模块名称
   * @param {Module} module 子模块
   * @returns {void}
   */
  addChild(key, module) {
    this._children[key] = module
  }

  /**
   * @public
   * @method
   * @name getChild
   * @description 获取子模块
   * @param {string} key 子模块的名称
   * @returns {Module}
   */
  getChild(key) {
    return this._children[key]
  }

  /**
   * @public
   * @method
   * @name forEachChild
   * @description 遍历子模块
   * @param {Function} fn 遍历时的处理函数，接受子模块、名称作为参数
   * @returns {void}
   */
  forEachChild(fn) {
    utils.forEachValue(this._children, fn)
  }

  /**
   * @public
   * @method
   * @name forEachGetter
   * @description 遍历 getters
   * @param {Function} fn 遍历时的处理函数，接受对应的值、键作为参数
   * @returns {void}
   */
  forEachGetter(fn) {
    if (this._rawModule.getters) {
      utils.forEachValue(this._rawModule.getters, fn)
    }
  }

  /**
   * @public
   * @method
   * @name forEachAction
   * @description 遍历 actions
   * @param {Function} fn 遍历时的处理函数，接受对应的值、键作为参数
   * @returns {void}
   */
  forEachAction(fn) {
    if (this._rawModule.actions) {
      utils.forEachValue(this._rawModule.actions, fn)
    }
  }

  /**
   * @public
   * @method
   * @name forEachMutation
   * @description 遍历 mutations
   * @param {Function} fn 遍历时的处理函数，接受对应的值、键作为参数
   * @returns {void}
   */
  forEachMutation(fn) {
    if (this._rawModule.mutations) {
      utils.forEachValue(this._rawModule.mutations, fn)
    }
  }
}

export default Module
