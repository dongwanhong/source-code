# Vuex

`Vuex` 是一个专为 `Vue.js` 应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。

每一个 `Vuex` 应用的核心就是 `store`（仓库）。“store”基本上就是一个容器，它包含着你的应用中大部分的状态 (state)。

## Vue.use

如何才能注册一个插件呢？

在 `Vue` 应用中提供了一个全局的 `use` 方法，一个为插件量身定制的 API，通过它你可以访问到 `Vue` 构造函数，然后就可以添加一些全局方法和属性等等。

那么这个方法是如何运行的呢？

```javascript
/**
 * 将类数组转换为真正的数组
 */
function toArray(list, start) {
  start = start || 0
  let i = list.length - start
  const ret = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}

Vue.use = function(plugin) {
  // 判断插件是否已注册
  const installedPlugins =
    this._installedPlugins || (this._installedPlugins = [])
  if (installedPlugins.indexOf(plugin) > -1) {
    return this
  }

  // additional parameters
  const args = toArray(arguments, 1)
  args.unshift(this)
  if (typeof plugin.install === 'function') {
    plugin.install.apply(plugin, args)
  } else if (typeof plugin === 'function') {
    plugin.apply(null, args)
  }
  installedPlugins.push(plugin)
  return this
}
```

可见，在这个方法中首先会对传入的插件进行判断，如果该组件已经注册则直接返回 `Vue` 的实例，因此即使多次调用也只会注册一次该插件。

接着，判断了插件是否提供了 `install` 方法，如果有则将 `Vue` 实例和传入的除插件外的其它参数作为参数传入进行调用。

如果没有，则退一步，如果插件本身是一个函数，就以同样的参数进行调用，只不过前后运行时的 `this` 指向不同，前者为插件，后者则为空。

注册成功后，将插件推入已注册的队列中，然后返回 `Vue` 的实例。

**注意**：需要在调用 `new Vue()` 启动应用之前完成插件的注册。

## beforeCreate

接下来，如何才能在所有的组件中访问到仓库呢？

在 `Vue` 和子组件初始化时，会将开发者提供的配置项和已有的配置进行合并，然后绑定在实例的 `$options` 属性上，并在 `patch` 的过程中，为其添加 `$parent` 属性和 `$children` 属性来建立组件间的父子关系。

当然，在合并以及 `patch` 过程中会有许多细节和差异，重要的是在实例化 `Vue` 时我们传递了仓库 `store` 作为配置项，所以在根组件中通过 `this.$options.store` 就可以拿到我们的仓库。

进一步在根组件的子组件中，我们只需要通过 `this.$options.$parent.$options.store` 就可以取到仓库。同理，所有的子孙组件都可以按照同理的方式拿到仓库。

对于一个项目来说，组件嵌套很深，所以会使得整个获取链变得丑陋且难以维护。为此，我们在取得仓库时，就可以把仓库绑定到当前实例中，然后其子组件就可以在父组件上进行获取。

最好，我们能在用户的任何操作之前完成这部分工作，而 `Vue` 提供的生命周期函数 `beforeCreate` 中正好符合这个条件。

```javascript
beforeCreate() {
  const options = this.$options
  // store injection
  if (options.store) {
    // 根组件
    this.$store = options.store
  } else if (options.$parent && options.$parent.$store) {
    this.$store = options.$parent.$store
  }
}
```

如此以来，我们只要在每个组件的 `beforeCreate` 钩子函数中添加这段逻辑，然后在组件中就可以直接通过 `this.$store` 来获取到仓库了。

## Vux.mixin

不过，我们真的需要在每个组件中实现相同的逻辑去拿到仓库吗？

显然不能这么做，即使这样可以达到我们的目的，但是却存在诸多弊端，比如冗余、易出错等等。所以我们更希望一劳永逸，直接一次性给所有的组件添加这些处理逻辑。

解决这个问题之前，我们先来了解一下在 `Vue` 中提供的 `Vue.mixin` 方法。从实现上来看，很容易发现它其实就是在对配置项做合并。

```javascript
Vue.mixin = function(mixin) {
  this.options = mergeOptions(this.options, mixin)
  return this
}
```

在 `mergeOptions` 方法中自然做了很多处理，并针对不同的选项提供了不同的合并策略，在这里我们主要学习一下针对钩子函数的处理过程。

```javascript
function mergeHook(parentVal, childVal) {
  if (!childVal) {
    return parentVal
  }
  if (parentVal) {
    return parentVal.concat(childVal)
  }
  if (Array.isArray(childVal)) {
    return childVal
  }
  return [childVal]
}
```

可见处理的方式很简单，就是整合了前后的函数存放在一个数组中。在后续对应组件的创建过程中，它们将被陆续调用。

现在，很容易想到我们只需要通过 `Vue.mixin` 方法就可以给所有组件都预设一个 `beforeCreate` （上面实现的）钩子函数了。

## install

如何来整合上面的几项工作呢？

前面我们提到当使用 `Vue.use` 来注册一个插件时，会同时将 `Vue` 作为参数之一来调用组件上的 `install` 方法，因此可以将上面仓库的处理过程集中在该方法中。

```javascript
let Vue // 在组件安装时赋值
const Vuex = {
  install(_Vue) {
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
}
```

现在，对于我们在组件中使用的仓库的由来更加清晰了。

## Store

那么，作为选项传递给 `Vue` 的这个仓库到底是怎样的呢？

从使用上来看，我们会传递配置项给 `Vux.Store` 来创建一个仓库，可见在 `Vuex` 上会提供了一个名为 `Store` 的类，里面实现了状态管理的核心逻辑。

```javascript
class Store {
  constructor(options = {}) {}
}
```

## ModuleCollection

由于使用单一状态树，应用的所有状态会集中到一个比较大的对象中。当应用变得非常复杂时，`store` 对象就有可能变得相当臃肿。

因此在实际项目中，我们会把一个仓库分割成多个模块（module），每个模块拥有着与主模块基本一致的功能和使用方式。

同理，在实现上它们的逻辑也基本相同，所以不难想象接下来我们将以递归的方式来创建整个仓库。在这之前我们需要使用一个 `ModuleCollection` 类对传递进来的参数进行格式化，以便后续的操作。

```javascript
const module = {
  namespaced: false, // 命名空间的逻辑暂且忽略
  runtime: false, // 暂且忽略
  _children: {},
  _rawModule: { state: {}, mutations: {}, actions: {}, modules: {} },
  state: { __ob__: Observer },
  context: { dispatch: ƒ, commit: ƒ } // 暂且忽略
}
```

在结果中，每一层我们需要得到类似上面的结构，其中每个模块的 `_children` 属性会包含若干个嵌套了若干层次的模块，以此来建立起整个模块树的关系，而 `_rawModule` 则是包含了每个模块的原始配置。

由于每个模块的结构相差不多，为了便于管理我们使用一个 `Module` 类来创建模块的初始结构，除了初始化属性外，还包含两个简单的方法，用以添加或获取子模块。

```javascript
class Module {
  constructor(rawModule) {
    const rawState = rawModule.state

    this._children = Object.create(null)
    // 存储开发者传递的源模块对象
    this._rawModule = rawModule
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }

  addChild(key, module) {
    this._children[key] = module
  }

  getChild(key) {
    return this._children[key]
  }
}
```

由于期间将会多次对对象进行遍历，所以这里先封装一下对对象遍历的方法，它工作起来就像是数组的 `forEach` 方法一样。

```javascript
forEachValue(rawModule.modules, (rawChildModule, key) => {
  this.register(path.concat(key), rawChildModule)
})
```

然后，我们就在 `ModuleCollection` 的 `register` 方法中注册模块树的整体结构。

```javascript
class ModuleCollection {
  constructor(options = {} /* rawRootModule */) {
    this.register([], options)
  }

  get(path) {
    return path.reduce((module, key) => {
      return module.getChild(key)
    }, this.root)
  }

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
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule)
      })
    }
  }
}
```

在 `register` 方法中，首先通过 `Module` 类得到了模块的初始结构，然后根据 `path` 的长度来判断当前模块是否是根模块，如果是则将该模块注册到当前实例的 `root` 属性上，以便后续操作。

如果当前模块不是根模块，那么我们就需要通过 `path` 来取得上级模块的引用，然后把当前模块添加在上级模块的 `_children` 属性上，以建立起整个模块树。

## installModule

我们已经实现了构建模块树的整体思路，现在就使用它来继续完善仓库的创建。

```javascript
class Store {
  constructor(options = {}) {
    // 当全局对象上存在 Vue 时则自动注册 Vuex 插件
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue)
    }

    this._actions = Object.create(null)
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._modules = new ModuleCollection(options)

    const state = this._modules.root.state

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root)
  }
}
```

在构造函数中我们首先判断了全局是否存在 `Vue` 对象，如果有的话就直接调用我们前面实现的 `Vuex` 上的 `install` 方法，这也是我们在通过 `script` 标签引入 `Vuex` 时无需调用 `Vue.use` 方法的原因。

接着我们初始化了一些基本属性，并将注册模块树的结果绑定在仓库实例的 `_modules` 属性上，再后面我们就需要把得到的模块树进行安装了，`installModule` 函数就是来完成这部分工作的。

由于在过程中存在对模块相关信息的遍历处理，所以我们直接在模块上添加上相应的方法。

```javascript
class Module {
  // ...
  forEachChild(fn) {
    forEachValue(this._children, fn)
  }

  forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }

  forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }

  forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }
}
```

这看起来很清晰，所以我们直接继续后续的实现。

### state

在其中一个很大的关键点就是让仓库中的状态（state）变成响应式数据，这在 `Vue` 的帮助下很容易实现。

首先对于每个模块来说都具有自己的状态，第一步我们需要做的就是建立起各个模块之间状态的关系，整个建立的过程看起来和模块树的构建如出一辙。

```javascript
function installModule(store, rootState, path, module) {
  // set state
  if (!!path.length) {
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

  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child)
  })
}
```

不同的是，期间我们调用了 `Vue.set` 方法来向响应式对象中添加一个属性，并确保这个新属性同样是响应式的，且触发视图更新。

很明显，在这里我们没有对根状态调用 `Vue.set` 方法，那么它是怎么成为响应式对象的呢？

### mutations

对于 `mutations` 的处理相对比较简单，值得一提的是由于存在不同的模块，所以为了向诸如 `mutations` 这类的函数提供对应模块的指定数据，我们将相关的方法和数据都放置到 `local` 中进行管理。

```javascript
function getNestedState(state, path) {
  return path.reduce((state, key) => state[key], state)
}

function makeLocalContext(store, path) {
  const local = {}

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

function installModule(store, rootState, path, module) {
  // set state
  // ...

  const local = (module.context = makeLocalContext(store, path))

  // module.forEachChild ...
}
```

然后就是将每个模块的 `mutations` 都注册到仓库的 `_mutations` 属性上，如果了解发布订阅模式的话，这看起来很好理解。

```javascript
function registerMutation (store, type, handler, local) {
  const entry = store._mutations[type] || (store._mutations[type] = [])
  entry.push(function wrappedMutationHandler (payload) {
    handler.call(store, local.state, payload)
  })
}

function installModule(store, rootState, path, module) {
  // set state
  // ...

  const local = (module.context = makeLocalContext(store, path))

  module.forEachMutation((mutation, key) => {
    registerMutation(store, key, mutation, local)
  })

  // module.forEachChild ...
}
```

### getters

在前面的基础上 `getters` 的实现看起来就简单多了。

```javascript
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

function installModule(store, rootState, path, module) {
  // ...
  // module.forEachMutation ...

  module.forEachGetter((getter, key) => {
    registerGetter(store, key, getter, local)
  })

  // module.forEachChild ...
}
```

可见，我们按照同样的思路将各模块的 `getters` 都注册到了仓库的 `_wrappedGetters` 属性中，并对获取的函数进行了进行了包装，以传入合适的参数。

### action

通常，我们会将相关的异步操作放在 `action` 中进行处理，其注册的方式和前面的也大同小异。

```javascript
function isPromise(val) {
  return val && typeof val.then === 'function'
}

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
    if (!isPromise(res)) {
      res = Promise.resolve(res)
    }

    return res
  })
}

function installModule(store, rootState, path, module) {
  // ...
  // module.forEachMutation ...

  module.forEachAction((action, key) => {
    const handler = action.handler || action
    registerAction(store, key, handler, local)
  })

  // module.forEachGetter ...
}
```

不同的是为了让结果返回一个 `Promise`，所以在包装函数中先对处理函数的结果进行判断，如果不是一个 `promise`，则将其传递给 `Promise.resolve` 方法处理后再返回。

### resetStoreVM

前面，虽然我们将各模块的数据按照层级结构和根模块的数据建立了关系，并通过 `Vue.set` 方法转变成了响应式的数据，但仅仅如此还不能和我们的视图建立上关系，因为我们根模块的数据还只是普通的对象。

对于根模块的数据我们并不能调用 `Vue.set` 方法来处理，因为它已经没有父级了，为此最直接的方法就是调用 `Vue` 来创建一个新的实例，以此来建立整个仓库中的数据和视图层之间的关系。

而这一切都发生在 `resetStoreVM` 函数中。

```javascript
function resetStoreVM(store, state) {
  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  const silent = Vue.config.silent // 存储用户之前的配置
  Vue.config.silent = true // 确保取消 Vue 所有的日志与警告
  store._vm = new Vue({
    data: {
      $$state: state
    }
  })
  Vue.config.silent = silent
}

class Store {
  constructor(options = {}) {
    // installModule ...

    // initialize the store vm, which is responsible for the reactivity
    resetStoreVM(this, state /* rootState */)
  }
}
```

现在仓库中的数据和我们平时 `Vue` 项目中的数据的行为就是一样的了。

当然这里的工作不仅仅如此，前面我们把各模块的 `getters` 都放到了 `store._wrappedGetters` 上，而在读取时我们通常是直接在 `store.getters` 上读取的，所以还需要进一步处理。

如 `Vuex` 所言，其允许我们在 `store` 中定义“getter”（可以认为是 store 的计算属性）。就像计算属性一样，`getter` 的返回值会根据它的依赖被缓存起来，且只有当它的依赖值发生了改变才会被重新计算。

事实上它的实现正是利用了 `Vue` 的计算属性，所以整个过程看起来非常清晰。

```javascript
function partial(fn, arg) {
  return function() {
    return fn(arg)
  }
}

function resetStoreVM(store, state) {
  // bind store public getters
  store.getters = {}
  const wrappedGetters = store._wrappedGetters
  const computed = {}
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldVm.
    // using partial to return function with only arguments preserved in closure environment.
    computed[key] = partial(fn, store)
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true // for local getters
    })
  })

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  const silent = Vue.config.silent
  Vue.config.silent = true
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })
  Vue.config.silent = silent
}
```

现在整个仓库的数据已经变成响应式的了，但是我们把数据都放置到了 `store._vm` 上，为了方便使用我们需要再做一层代理。

```javascript
class Store {
  constructor(options = {}) {
    // ...
  }

  get state() {
    return this._vm._data.$$state
  }
}
```

如果需要深入理解这部分的内容就需要进一步了解一下 `Vue` 的响应式原理了。

### commit

目前，仓库的构建已经差不多了，我们可以通过 `store.state` 来直接获取其中的数据，那么如何改变呢？

通常，我们会调用仓库提供的 `commit` 方法来显式地提交 `mutation` 以改变 `store` 中的状态，在该方法中会首先对传入的参数进行处理，然后再派发此次提交。

```javascript
function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}

function unifyObjectStyle(type, payload, options) {
  if (isObject(type) && type.type) {
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

class Store {
  constructor(options = {}) {
    // ...
    // this._modules = new ModuleCollection(options)

    // bind commit to self
    const store = this
    const { commit } = this
    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options)
    }

    // const state = this._modules.root.state
    // ...
  }

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
}
```

现在，当我们通过 `commit` 方法提交一个类型的 `mutation` 时，我们在各模块注册的同类型的 `mutation` 都将被执行。

### dispatch

另外，为了更好的管理异步操作，前面我们把相关的异步方法都放在了 `_actions` 中，现在也需要提供相应的 `dispatch` 方法来触发，它和 `commit` 方法的工作原理很相似。

```javascript
class Store {
  constructor(options = {}) {
    // ...
    // bind commit and dispatch to self
    const store = this
    const { commit, dispatch } = this
    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options)
    }
    this.dispatch = function boundDispatch (type, payload) {
      return dispatch.call(store, type, payload)
    }

    // const state = this._modules.root.state
    // ...
  }

  // commit(_type, _payload, _options) { ... }

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
```

同样，为了保证结果是一个 `Promise`，所以在存在多个处理函数的情况下，我们把几个处理函数的结果传递给 `Promise.all` 方法进行处理后再返回。

还记得当时注册 `action` 时传递给处理函数的参数吗？我们分别传递了模块和仓库的 commit，dispatch 方法，但是模块上这两个方法是不存在的，所以现在姑且让这两个方法直接指向对应仓库的方法。

```javascript
function makeLocalContext(store, path) {
  const local = {
    commit: store.commit,
    dispatch: store.dispatch
  }
  // ...
}
```

终于，整个仓库可以很好的工作了。

## 参考

- [Vuex 是什么？ | Vuex][1]
- [vuejs/vuex: 🗃️ Centralized State Management for Vue.js.][2]

[1]: https://vuex.vuejs.org/zh/
[2]: https://github.com/vuejs/vuex
