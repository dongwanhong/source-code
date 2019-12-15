/**
 * @private
 * @function
 * @name bindActionCreator
 * @description
 * 接受一个 actionCreator 函数，将其包装在 dispatch 函数中进行调用
 * 最后返回包装后的函数
 * @param {Function} actionCreator actionCreator 函数
 * @param {Function} dispatch 仓库提供的 dispatch 函数
 * @returns {Function} 包装后的函数
 */
function bindActionCreator(actionCreator, dispatch) {
  return function bindedActionCreator(...args) {
    return dispatch(actionCreator.apply(this, args))
  }
}

/**
 * @public
 * @function
 * @name bindActionCreators
 * @description
 * 接受一个 actionCreator 函数或一个对象，将每个函数包装在 dispatch 函数中进行调用
 * 最后，返回包装后的结果
 * @param {Function | Object} actionCreators actionCreator 函数或一个对象
 * @param {Function} dispatch 仓库提供的 dispatch 函数
 * @returns {Function | Object} 包装后的函数或对象
 */
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch)
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error('bindActionCreators expected an object or a function.')
  }

  const boundActionCreators = {}
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key]
    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch)
    }
  }
  return boundActionCreators
}

/**
 * @public
 * @function
 * @name compose
 * @description
 * 接受若干个函数并将其组合成一个从右向左执行的新函数
 * 每个函数都会接受上一个函数的调用结果作为参数
 * 第一个函数接受的则是我们调用新函数时传入的参数
 * @param  {...Function} funcs 若干个函数
 * @returns {Function} 新函数
 */
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg
  }

  if (funcs.length === 1) {
    return funcs[0]
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)))
}

/**
 * @public
 * @function
 * @name applyMiddleware
 * @description
 * 接受一组中间件，处理后返回一个应用中间件的 store 增强器函数
 * @param  {...Function} middlewares 要应用的中间件链
 * @returns {Function} 应用中间件的 store 增强器
 */
function applyMiddleware(...middlewares) {
  return createStore => (reducer, ...args) => {
    const store = createStore(reducer, ...args)
    // 因为 dispatch 需要传递给中间件所以需要事先声明
    // 但不必有默认值
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed.'
      )
    }

    // 处理中间件
    // 只暴露有限的接口给中间件
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...rest) => dispatch(action, ...rest)
    }
    const chain = middlewares.map(middleware => middleware(middlewareAPI))
    dispatch = compose(...chain)(store.dispatch)

    return {
      ...store,
      dispatch // 覆盖之前的 dispatch 方法
    }
  }
}

/**
 * @public
 * @function
 * @name combineReducers
 * @description
 * 根据一个包含若干 reducer 的对象，整合成一个新的 reducer 函数
 * @param {Object} reducers 包合了若干 reducer 的对象
 * @returns {Function} 新的 reducer 函数
 */
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers)
  const { length } = reducerKeys

  /**
   * @private
   * @function
   * @name combination
   * @description
   * 接受老的状态和一个动作，然后返回一个具有相同形状的状态对象
   * @param {Object} state 老状态
   * @param {Object} action 动作
   * @returns {Object} 新状态
   */
  function combination(state = {}, action) {
    const nextState = {}

    /**
     * 遍历 reducers，然后取出对应的 state 进行处理
     * 最后把结果再写入到新的状态中
     */
    for (let i = 0; i < length; i++) {
      const key = reducerKeys[i]
      const reducer = reducers[key]
      const previousStateForKey = state[key]
      const nextStateForKey = reducer(previousStateForKey, action)
      nextState[key] = nextStateForKey
    }

    return nextState
  }

  return combination
}

/**
 * @public
 * @function
 * @name createStore
 * @description
 * 创建保存状态树的 Redux 仓库
 * @param {Function} reducer 指定了应用状态的变化如何响应 actions 并发送到仓库
 * @param {*} preloadedState 可选的，初始状态
 * @returns {Object} 仓库
 */
const createStore = (reducer, preloadedState) => {
  let state = preloadedState
  const listeners = []

  /**
   * @public
   * @method
   * @name getState
   * @description
   * 获取仓库当前状态
   * @returns {Object} 仓库当前状态
   */
  function getState() {
    return state
  }

  /**
   * @public
   * @method
   * @name subscribe
   * @description
   * 添加回调函数并返回相应的移除函数
   * @param {Function} listener 在每次 dispatch 时执行的回调函数
   * @returns {Function} 移除监听器的函数
   */
  function subscribe(listener) {
    listeners.push(listener)

    // 同时，返回一个取消订阅的函数
    return function unsubscribe() {
      const index = listeners.indexOf(listener)
      listeners.splice(index, 1)
    }
  }

  /**
   * @public
   * @method
   * @name dispatch
   * @description
   * 派发一个动作，这是改变仓库状态的唯一途径；并执行相应的回调队列
   * @param {Object} action 描述变化的对象
   * @returns {Object} 返回得到的 action
   */
  function dispatch(action) {
    state = reducer(state, action)
    listeners.forEach(listener => listener())

    return action
  }

  /**
   * @public
   * @function
   * @name replaceReducer
   * @description
   * 接受新的 reducer 替换当前的 reducer，并触发一次更新
   * @param {Function} nextReducer 新的 reducer
   * @returns {Object} 当前仓库
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    reducer = nextReducer
    dispatch({ type: Symbol('REPLACE') })

    // eslint-disable-next-line no-use-before-define
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
