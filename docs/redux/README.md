# Redux

`Redux` 是 `JavaScript` 状态容器，提供可预测化的状态管理，让你构建一致化的应用，运行于不同的环境（客户端、服务器、原生应用），并且易于测试。

## 基本概念

既然 `Redux` 是一个状态容器，那么什么状态呢？简而言之，就是数据。

在 `Redux` 的设计思想中认为：

- `Web` 应用是一个状态机，视图与状态是一一对应的；
- 所有的状态，都保存在一个对象里面。

```javascript
// 它可能就是这样的
const initState = {
  count: 0
}
```

记住这两点，因为它对我们的理解和实现的确很有帮助。

另外，在继续工作之前，了解观察者模式也同样重要。不仅仅是在 `Redux` 中，在许多框架或库的实现中都有它的影子，比如我们常见的 `Vuex`。

观察者模式在软件设计中是一个对象，维护了一个依赖列表，当任何状态发生改变时会自动通知它们。

```javascript
class Subject {
  constructor(state) {
    this.state = state
    this.observers = []
  }

  getState() {
    return this.state
  }

  setState(state) {
    this.state = state
    this.notify()
  }

  attach(observer) {
    this.observers.push(observer)
  }

  notify() {
    this.observers.forEach(observer => observer.update())
  }
}

class Observer {
  // 这可以是一个抽象类
  // 通过继承来重写 update 方法（多态）
  update() {
    console.log('Changed state')
  }
}
```

结构很像 `Vue` 中的 `Dep` 和 `Watcher` 嘛？

## createStore

现在，一些简单的概念已经有了，那么接下来就开始来走进我们的猪脚 `Redux` 吧。

就像上面所说的，`Redux` 将所有的状态保存在一个对象中，并提供了 `createStore` 方法来创建一个保存状态树的仓库和一些访问它的 API。

```javascript
const createStore = preloadedState => {
  let state = preloadedState // 初始状态

  function getState() {
    return state
  }

  // store
  return {
    getState
  }
}
```

结合上面的观察者模式，对应 `attach` 方法，在 `Redux` 中提供了 `subscribe` 方法，并且还返回了一个供取消订阅调用的函数。

```javascript
const createStore = preloadedState => {
  let state = preloadedState
  const observers = []

  // 省略部分代码...

  function subscribe(observer) {
    observers.push(observer)
    // 返回一个取消订阅的函数
    return function() {
      const index = observers.indexOf(observer)
      observers.splice(index, 1)
    }
  }

  return {
    getState,
    subscribe
  }
}
```

那么与 `setState` 和 `notify` 对应的又是什么方法呢？

我们在 `Redux` 中，总是通过 `dispatch` 方法来派发一个动作，从而调用给定的 `reducer` 来改变 `state` 的值，最后监听器们就会被执行。

可以说 `dispatch` 方法其实整合了 `setState` 和 `notify` 的功能。

```javascript
const createStore = preloadedState => {
  let state = preloadedState
  const observers = []

  // ...
  function dispatch(action) {
    // setState
    state = reducer(state, action)
    // notify
    observers.forEach(observer => observer())
    return action
  }

  // store
  return {
    getState,
    dispatch,
    subscribe
  }
}
```

而这些 `reducer` 实际上就来自于我们执行 `createStore` 函数时传递的第一个参数，现在传递的 `preloadedState` 其实是可选的第二个参数。

我们来改变一下传参，而且为了和源码更像，同时将 `observer` 改变为 `listener` 然后就可以得到一个简单的版本了。

```javascript
const createStore = (reducer, preloadedState) => {
  let state = preloadedState
  const listeners = []

  function getState() {
    return state
  }

  function subscribe(listener) {
    listeners.push(listener)
    // 同时，返回一个取消订阅的方法
    return function unsubscribe() {
      const index = listeners.indexOf(listener)
      listeners.splice(index, 1)
    }
  }

  function dispatch(action) {
    state = reducer(state, action)
    listeners.forEach(listener => listener())
    return action
  }

  return {
    getState,
    dispatch,
    subscribe
  }
}
```

让我们来试试看看吧。

```javascript
const INCREMENT = 'INCREMENT'
const DECREMENT = 'DECREMENT'

function counterReducer(state, action) {
  switch (action.type) {
    case INCREMENT:
      return Object.assign({}, state, { count: state.count + 1 })
    case DECREMENT:
      return Object.assign({}, state, { count: state.count - 1 })
    default:
      return state
  }
}

const counterState = {
  count: 0
}
const store = createStore(counterReducer, counterState)

store.dispatch({ type: INCREMENT })
console.log(store.getState())
store.dispatch({ type: DECREMENT })
console.log(store.getState())
```

和我们平时使用 `Redux` 的方式很像吧，而且，它工作得很好。

## combineReducers

在一个大型项目中，我们可能会派发大量的动作，如果所有的处理逻辑都放在一个 `reducer` 中的话，会显得异常混乱，且难以维护。

秉承高内聚，低耦合的思想，我们往往希望将一个组件或者说同一类操作提取出来放在一个单独的地方进行管理，所以就会生出多个 `reducer`。

在 `Redux` 中，提供了 `combineReducers` 函数来将这些零散的 `reducer` 进行整合，那么它是怎么做到的呢？

假设我们现在还需要对一个用户的信息进行管理，初始的样子就像是这样。

```javascript
const userState = {
  name: 'TianJiu',
  age: 18
}
```

对应的，我们也为 `user` 也增加相应的 `reducer`。

```javascript
const SET_NAME = 'SET_NAME'
const SET_AGE = 'SET_AGE'

function userReducer(state, action) {
  switch (action.type) {
    case SET_NAME:
      return Object.assign({}, state, { name: action.name })
    case SET_AGE:
      return Object.assign({}, state, { age: action.age })
    default:
      return state
  }
}

const store = createStore(userReducer, userState)

store.dispatch({ type: SET_NAME, name: 'Anani' })
console.log(store.getState())
store.dispatch({ type: SET_AGE, age: 17 })
console.log(store.getState())
```

目前，两个状态及其对应的 `reducer` 都可以被放置到不同的地方，因为它们没有任何关联，这很好，至少不会像上面提及的那样让 `reducer` 变得臃肿。

可是，问题在于 `Redux` 中只能有一个状态，所以我们需要对两个状态做一些调整，将之前的 `state` 变成了一个新的 `state` 的一个属性，它看起就像是这样。

```javascript
const state = {
  counter: counterState,
  user: userState
}
```

同样，我们整合两个 `reducer` 放在一个对象中。

```javascript
const reducers = {
  counter: counterReducer,
  user: userReducer
}
```

最后，再把 `reducers` 交给我们的 `combineReducers` 函数进行整合后，返回一个新的 `reducer`。

```javascript
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers)
  const { length } = reducerKeys

  function combination(state = {}, action) {
    const nextState = {}

    /**
     * 遍历 reducers，然后取出对应的 state 进行处理
     * 最后把结果再写入到新的状态中
     */
    for (let i = 0; i < length; i++) {
      const key = reducerKeys[i]
      const reducer = reducers[key] // 当前 reducer
      const previousStateForKey = state[key] // 对应的 state
      const nextStateForKey = reducer(previousStateForKey, action)
      nextState[key] = nextStateForKey
    }

    return nextState
  }

  return combination
}
```

在这个新的 `reducer` 中，当接受到新的动作指令时，会遍历总的 `reducers`，然后取出对应的 `state` 进行处理，最后再把结果写入到新的 `state` 中。

再来试试吧。

```javascript
// 省略常量等信息 ...

const store = createStore(combineReducers(reducers), state)

store.dispatch({ type: INCREMENT })
console.log(store.getState())
store.dispatch({ type: DECREMENT })
console.log(store.getState())

store.dispatch({ type: SET_NAME, name: 'Anani' })
console.log(store.getState())
store.dispatch({ type: SET_AGE, age: 17 })
console.log(store.getState())
```

不出意料，它照样工作的很好。

## middleWare

我们自定义 `Redux` 已经可以很好的完成基本功能了，可是，现在用户想再添加一个打印日志的功能（打印改变前后的状态），要怎么做呢？

最简单的办法就是使用函数劫持的方式修改我们的 `store.dispatch` 方法。

```javascript
const store = createStore(reducer)
const next = store.dispatch

store.dispatch = function loggerDispatch(action) {
  console.log('Old state: ', store.getState())
  next(action)
  console.log('New state: ', store.getState())
}
```

确实很简单，如果我们还要增加更多的功能呢？原理完全一样，就是再次劫持我们已经包装过的 `store.dispatch` 方法，然后加入自己想要的功能。

但是，在开放关闭的原则下，最好不要让使用者直接进行修改以定制或增强 `Redux` 的功能；因此，必须为此提供一个接口来实现，而 `applyMiddleware` 函数正是为此而生。

`applyMiddleware` 函数接受一组中间件，然后返回一个应用中间件的 `store` 增强器函数，增强器函数会接受最初的 `createStore` 函数，然后再返回新的 `createStore` 函数。

```javascript
function applyMiddleware(...middlewares) {
  // 增强器函数
  return function(createStore) {
    // 新的 createStore 函数
    return function(reducer) {
      // 调用之前的 createStore 函数创建仓库
      const store = createStore(reducer)
      // 处理中间件 ...

      // 返回仓库
      return store
    }
  }
}
```

在进一步了解中间件的处理方式之前，我们需要先了解一下中间件的创建和使用方式，以反推我们的实现。

同样是上面打印日志的功能，我们整改一下，再来解释它的用意。

```javascript
// 中间件定制函数接受到的参数(api)并不是 store
// 而是在处理中间件时传递过来的限定的接口
function logger(api) {
  // 当前中间件
  // next 即为下一个中间件
  return function(next) {
    // 新的 dispath 方法
    return function(action) {
      console.log('Old state: ', api.getState())
      next(action)
      console.log('New state: ', api.getState())
    }
  }
}
```

在上面中间件创建中，我们的工作主要分为三层，第一层的函数接受一个名为 `api` 的参数，其中包含了关于 `store` 的一些接口，以便我们后续获取到关于仓库的相关信息。

而在第二层中的函数，它接受到一个 `next` 参数，是对下一个中间件的引用，最初时就是开始的 `store.dispatch` 方法，它们将会在第三层的函数中被调用。

那么中间件们到底是如何工作的呢？我们再次回到 `applyMiddleware` 函数中，首先传入仓库的相关信息依次调用创建中间件时的第一层函数，得到的是第二层函数组成的数组。

```javascript
function applyMiddleware(...middlewares) {
  return function(createStore) {
    return function(reducer, ...args) {
      let dispatch = null
      const store = createStore(reducer, ...args)

      // 开始处理中间件
      // 组装暴露给中间件的有限的接口
      const middlewareAPI = {
        getState: store.getState,
        dispatch: (action, ...rest) => dispatch(action, ...rest)
      }
      // 得到的新的数组
      // 其中函数及其下层作用域可以通过 api 来获取仓库的信息
      const chain = middlewares.map(middleware => middleware(middlewareAPI))

      return sotre
    }
  }
}
```

进一步，为了得到第三层中每个中间件真正的核心功能，我们还需要继续调用 `chain` 数组中的函数。

假设现在只有两个中间件，那么我们就需要先调用最后一个函数得到其第三层中返回的新的 `dispatch` 方法，然后再将其传给第一个中间件。

```javascript
// 就像上面所说的，第一次调用时
// 参数 next 得到的就是开始的 store.dispatch 方法
const tempDispatch = chain[1](store.dispatch)
const dispatch = chain[0](tempDispatch)
```

因为，这里只有两个中间件，所以第二次也就得到了最终的 `dispatch` 方法。最后，我们再用此方法覆盖掉仓库本身的 `dispatch` 方法就可以了。

## compose

我们假设只有两个中间件的做法并不能解决其它情况，因此需要提供一个更加通用的方法，也就是使用 `compose` 函数来处理。

`compose` 函数可以接受若个函数作为参数，然后将这些函数进行整合，并返回一个新的函数。

当在这个函数被调用时，它会从右向左依次的调用之前传入的函数，并把前一个函数的调用结果传递给下一个函数，这和我们中间件的处理方式不谋而合。

那么 `compose` 函数又是怎么实现的呢？这里主要利用的数组中的 `reduce` 方法，和求和的情况很像对吧。

```javascript
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}
```

因此，当我们把 `chain` 传递给 `compose` 函数处理后就可以直接得到最终的 `dispatch` 方法。

```javascript
function applyMiddleware(...middlewares) {
  return function(createStore) {
    return function(reducer, ...args) {
      let dispatch = null
      const store = createStore(reducer, ...args)
      const middlewareAPI = {
        getState: store.getState,
        dispatch: (action, ...rest) => dispatch(action, ...rest)
      }
      const chain = middlewares.map(middleware => middleware(middlewareAPI))
      // 通过 compose 函数等到最终的 dispatch 方法
      dispatch = compose(...chain)(store.dispatch)

      return {
        ...store,
        dispatch // 覆盖之前的 dispatch 方法
      }
    }
  }
}
```

再次，验证一下。

```javascript
const storeEnhancer = applyMiddleware(logger)
const storeEnhancerStoreCreator = storeEnhancer(createStore)
const reducer = combineReducers(reducers)
const store = storeEnhancerStoreCreator(reducer, state)

store.dispatch({ type: INCREMENT })
console.log(store.getState())
```

万幸，现在我们已经将中间件的部分也顺利完成了。如果了解 `Koa` 的同学，对这种中间件的工作方式一定不会陌生，也就是我们经常说的洋葱模型。

## bindActionCreators

通常我们会把 `action` 的产生放在一个函数中，并集中在一些文件中进行统一管理，而这些函数就被称为 `actionCreator`，最后在其它地方被调用。

```javascript
const actionCreators = {
  // actionCreator
  setName(name) {
    return {
      type: SET_NAME,
      name
    }
  }
}

// 根据需求调用不同的 actionCreator，然后进行派发
const actions = {
  setName(name) {
    store.dispatch(actionCreators.setName(name))
  }
}

actions.setName('Anani')
```

当我们要创建和派发多个动作时，重复的工作将会增加很多，所以 `bindActionCreators` 函数对其进行了简化。

它把一个 `value` 为不同 `actionCreator` 的对象，转成拥有同名 `key` 的对象。同时使用 `dispatch` 对每个 `actionCreator` 进行包装，以便可以直接调用它们。

所以，上面的例子可以改成下面这样。

```javascript
const actionCreators = {
  // actionCreator
  setName(name) {
    return {
      type: SET_NAME,
      name
    }
  }
}

const actions = bindActionCreators(actionCreators, store.dispatch)
actions.setName('Anani')
```

实现它的核心其实是利用了 `bindActionCreator` 函数，该函数接受一个 `actionCreator` 函数和一个 `dispatch` 方法，最后返回一个新的函数。

这个新的函数在将来执行时，会将得到的参数传递给之前的 `actionCreator` 函数进行调用，并将结果利用 `dispatch` 方法进行派发。

```javascript
function bindActionCreator(actionCreator, dispatch) {
  return function(...args) {
    return dispatch(actionCreator.apply(this, args))
  }
}
```

而当我们得到的 `actionCreators` 是一个对象时，会在 `bindActionCreators` 函数中做处理，最终再交给核心的 `bindActionCreator` 函数来包装。

```javascript
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function.')
  }

  const boundActionCreators = {}
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}
```

## replaceReducer

在但不仅在 `React` 中，我们通常会对组件进行按需加载以加快首屏的渲染速度，结合 `combineReducers` 的功能，同时也可以让 `reducer` 随组件在需要时再被加载和添加。

因此，在 `Redux` 中提供了 `replaceReducer` 方法来让我们可以用新的 `reducer` 去替换当前的 `reducer`，而且它的实现特别明朗。

```javascript
const createStore = (reducer, preloadedState) => {
  // ...
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    reducer = nextReducer
    dispatch({ type: Symbol('REPLACE') })

    return store
  }

  // store
  const store = {
    getState,
    dispatch,
    subscribe,
    replaceReducer
  }

  return store
}
```

现在，大功告成了。

## 参考

- [Redux 入门教程（一）：基本用法 - 阮一峰的网络日志][1]
- [Publish–subscribe pattern - Wikipedia][3]
- [观察者模式与订阅发布模式的区别 - 一像素 - 博客园][2]
- [redux middleware 详解 - 知乎][5]
- [reduxjs/redux: Predictable state container for JavaScript apps][4]

[1]: http://www.ruanyifeng.com/blog/2016/09/redux_tutorial_part_one_basic_usages.html
[3]: https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern
[2]: https://www.cnblogs.com/onepixel/p/10806891.html
[4]: https://github.com/reduxjs/redux
[5]: https://zhuanlan.zhihu.com/p/20597452
