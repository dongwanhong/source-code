import utils from '@utils'
import Module from './module'

/**
 * 注册模块树
 * @class
 */
class ModuleCollection {
  constructor(options = {} /* rawRootModule */) {
    this.register([], options)
  }

  /**
   * @private
   * @method
   * @name get
   * @description 获取父级模块
   * @param {string[]} path 层级属性
   * @returns {Module}
   */
  get(path) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root)
  }

  /**
   * @private
   * @method
   * @name register
   * @description 注册组件树
   * @param {string[]} path 层级属性
   * @param {object} rawModule 模块的原始配置
   * @returns {void}
   */
  register(path, rawModule) {
    const newModule = new Module(rawModule)

    if (path.length === 0) {
      this.root = newModule
    } else {
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path.slice(-1)[0], newModule)
    }

    // 注册嵌套的模块
    if (rawModule.modules) {
      utils.forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule)
      })
    }
  }
}

export default ModuleCollection
