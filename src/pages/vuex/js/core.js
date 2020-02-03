/* eslint-disable no-console, no-shadow, no-multi-assign, consistent-return */

import utils from '@utils'
import ModuleCollection from './module-collection'

let Vue // 在组件安装时赋值

/**
 * @function
 * @name install
 * @description 给每个组件挂载仓库实例
 * @param {*} _Vue Vue
 * @returns {void}
 */
function install(_Vue) {
  Vue = _Vue

  Vue.mixin({
    beforeCreate() {
      const options = this.$options
      // store injection
      if (options.store) {
        // 根组件
        this.$store = options.store
      } else if (options.parent && options.parent.$store) {
        this.$store = options.parent.$store
      }
    }
  })
}

/**
 * @public
 * @function
 * @name getNestedState
 * @description 获取嵌套的状态
 * @param {*} state 状态
 * @param {*} path 层级属性
 * @returns {object}
 */
function getNestedState(state, path) {
  return path.reduce((state, key) => state[key], state)
}

/**
 * @public
 * @function
 * @name makeLocalContext
 * @description 创建模块的接口
 * @param {*} store 仓库
 * @param {*} path 层级属性
 * @returns {object}
 */
function makeLocalContext(store, path) {
  const local = {
    commit: store.commit,
    dispatch: store.dispatch
  }

  // getters and state object must be gotten lazily
  // because they will be changed by vm update
  Object.defineProperties(local, {
    getters: {
      get: () => store.getters
    },
    state: {
      get: () => getNestedState(store.state, path)
    }
  })

  return local
}

/**
 * @public
 * @function
 * @name registerMutation
 * @description 注册 mutation
 * @param {Store} store 仓库
 * @param {string} type 类型
 * @param {Function} handler 处理函数
 * @param {object} local 提供给模块的接口
 * @returns {void}
 */
function registerMutation(store, type, handler, local) {
  const entry = store._mutations[type] || (store._mutations[type] = [])
  entry.push(function wrappedMutationHandler(payload) {
    handler.call(store, local.state, payload)
  })
}

/**
 * @public
 * @function
 * @name registerGetter
 * @description 注册 getter
 * @param {Store} store 仓库
 * @param {string} type 类型
 * @param {Function} rawGetter 处理函数
 * @param {object} local 提供给模块的接口
 * @returns {void}
 */
function registerGetter(store, type, rawGetter, local) {
  if (store._wrappedGetters[type]) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] duplicate getter key: ${type}`)
    }
    return
  }

  store._wrappedGetters[type] = function wrappedGetter(store) {
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters // root getters
    )
  }
}

/**
 * @public
 * @function
 * @name registerAction
 * @description 注册 action
 * @param {Store} store 仓库
 * @param {string} type 类型
 * @param {Function} handler 处理函数
 * @param {object} local 提供给模块的接口
 * @returns {void}
 */
function registerAction(store, type, handler, local) {
  const entry = store._actions[type] || (store._actions[type] = [])
  entry.push(function wrappedActionHandler(payload) {
    let res = handler.call(
      store,
      {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store.getters,
        rootState: store.state
      },
      payload
    )
    if (!utils.isPromise(res)) {
      res = Promise.resolve(res)
    }

    return res
  })
}

/**
 * @public
 * @function
 * @name installModule
 * @description 安装模块
 * @param {Store} store 仓库
 * @param {object} rootState 根状态
 * @param {string} path 层级属性
 * @param {Module} module 模块
 * @returns {void}
 */
function installModule(store, rootState, path, module) {
  // set state
  if (path.length) {
    const parentState = path
      .slice(0, -1)
      .reduce((state, key) => state[key], rootState)
    const moduleName = path[path.length - 1]

    if (process.env.NODE_ENV !== 'production') {
      if (moduleName in parentState) {
        console.warn(
          `[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join(
            '.'
          )}"`
        )
      }
    }

    Vue.set(parentState, moduleName, module.state)
  }

  const local = (module.context = makeLocalContext(store, path))

  module.forEachMutation((mutation, key) => {
    registerMutation(store, key, mutation, local)
  })

  module.forEachAction((action, key) => {
    const handler = action.handler || action
    registerAction(store, key, handler, local)
  })

  module.forEachGetter((getter, key) => {
    registerGetter(store, key, getter, local)
  })

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })
}

/**
 * @public
 * @function
 * @name resetStoreVM
 * @description 构建响应式系统
 * @param {Store} store 仓库
 * @param {object} state 状态
 * @returns {void}
 */
function resetStoreVM(store, state) {
  // bind store public getters
  store.getters = {}
  const wrappedGetters = store._wrappedGetters
  const computed = {}
  utils.forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldVm.
    // using partial to return function with only arguments preserved in closure environment.
    computed[key] = utils.partial(fn, store)
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true // for local getters
    })
  })

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  const { silent } = Vue.config
  Vue.config.silent = true
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })
  Vue.config.silent = silent
}

/**
 * @public
 * @function
 * @name unifyObjectStyle
 * @descrtption 统一传参
 * @param {string | object} type 类型
 * @param {object} payload 额外的参数
 * @param {object | undefined} options 额外的配置项
 * @returns {object}
 */
function unifyObjectStyle(type, payload, options) {
  if (utils.isObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }

  if (process.env.NODE_ENV !== 'production') {
    console.assert(
      typeof type === 'string',
      `expects string as the type, but found ${typeof type}.`
    )
  }

  return { type, payload, options }
}

/**
 * 创建一个仓库
 * @class
 */
class Store {
  /**
   * @public
   * @method
   * @name constructor
   * @description 创建仓库
   * @param {object} options 仓库的配置项
   * @returns {Store}
   */
  constructor(options = {}) {
    // 当全局对象上存在 Vue 时则自动注册 Vuex 插件
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue)
    }

    this._actions = Object.create(null)
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._modules = new ModuleCollection(options)

    // bind commit and dispatch to self
    const store = this
    const { commit, dispatch } = this
    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options)
    }
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store, type, payload)
    }

    const { state } = this._modules.root

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root)

    // initialize the store vm, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreVM(this, state)
  }

  get state() {
    return this._vm._data.$$state
  }

  /**
   * @public
   * @method
   * @name commit
   * @description 提交（触发）一种类型的 mutation
   * @param {string} _type 类型
   * @param {*} _payload 额外的参数
   * @param {object} _options 额外的配置
   * @returns {void}
   */
  commit(_type, _payload, _options) {
    // check object-style commit
    const { type, payload } = unifyObjectStyle(_type, _payload, _options)
    const entry = this._mutations[type]

    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown mutation type: ${type}`)
      }
      return
    }
    entry.forEach(function commitIterator(handler) {
      handler(payload)
    })
  }

  /**
   * @public
   * @method
   * @name dispatch
   * @description 派发（触发）一种类型的 action
   * @param {string} _type 类型
   * @param {*} _payload 额外的参数
   * @returns {Primise}
   */
  dispatch(_type, _payload) {
    // check object-style dispatch
    const { type, payload } = unifyObjectStyle(_type, _payload)

    const entry = this._actions[type]
    if (!entry) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[vuex] unknown action type: ${type}`)
      }
      return
    }

    const result =
      entry.length > 1
        ? Promise.all(entry.map(handler => handler(payload)))
        : entry[0](payload)

    return result
  }
}

export default {
  install,
  Store
}
