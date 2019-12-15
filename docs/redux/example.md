<!-- markdownlint-disable MD041 -->

`Redux` 是 `JavaScript` 状态容器，提供了可预测化的状态管理。

Q：中间件的写法为什么要嵌套多层函数？而不直接在一层函数中传递三个参数？

A：

因为无论加入多少个中间件，归根到底我们最终需要的是一个接受 `action` 并进行派发的 `dispatch` 函数，最底层的函数正是为了实现这一点。

而第二层的 `next` 函数主要是为了配合 `compose` 函数对多个中间件进行包装，以实现我们的洋葱模型。

最外层则是为了给中间件提供仓库的相关接口，分层结构同时也让流程变得更加清晰明了。

Q：传递给中间件的 `middlewareAPI` 中的 `dispatch` 为什么要用匿名函数进行包裹？

A：因为中间件的工作原理是改写得到的 `dispatch` 函数，所以需要利用闭包保持对 `dispatch` 变量的引用，以在后续 `dispatch` 变量被改变时，仍然能取到正确（最新）的值。

Q：在 `middleware` 里调用 `api.dispatch` 方法跟调用 `next` 函数一样吗？

A：

在处理中间件的时候，我们以匿名函数的形式将 `dispatch` 函数进行包装，然后通过 `middlewareAPI` 传递给了中间件，因为闭包的关系它会保持对 `dispatch` 变量的引用。

当中间件处理完成后，我们会将最终得到的 `dispatch` 方法再赋值给这个变量，所以在中间件中调用 `api.dispatch` 实际上调用的是最后处理完成后的 `dispatch` 方法。

而 `next` 函数则是对下一个中间件的引用，执行时会调用下一个中间件。

接下来，这是一个相对完整的测试案例，你可以复制下面代码到浏览器的控制台中直接运行，或进行修改，以验证更过。

```javascript
const INCREMENT = 'INCREMENT'
const DECREMENT = 'DECREMENT'
const SET_NAME = 'SET_NAME'
const SET_AGE = 'SET_AGE'

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

const logger = api => next => action => {
  console.log('Old state: ', api.getState())
  next(action)
  console.log('New state: ', api.getState())
}

const counterState = {
  count: 0
}
const userState = {
  name: 'TianJiu',
  age: 18
}
const state = {
  counter: counterState,
  user: userState
}
const reducers = {
  counter: counterReducer,
  user: userReducer
}
const storeEnhancer = applyMiddleware(logger)
const storeEnhancerStoreCreator = storeEnhancer(createStore)
const reducer = combineReducers(reducers)
const store = storeEnhancerStoreCreator(reducer, state)

store.dispatch({ type: INCREMENT })
store.dispatch({ type: SET_NAME, name: 'Anani' })
```

在这里，我们基本阐述和实现了 `Redux` 的思想和功能，一些描述可能并不完全正确，希望可以共同学习，更进一步。
