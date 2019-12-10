const PENDING = 'PENDING'
const FULFILLED = 'FULFILLED'
const REJECTED = 'REJECTED'

/** Class Promise */
class _Promise {
  /**
   * @public
   * @function
   * @name constructor
   * @description
   * 立即调用 executor 函数，并返回所建 Promise 实例对象
   * @param {Function} executor 执行器，是带有 resolve 和 reject 两个参数的函数
   * @returns {Promise}
   */
  constructor(executor) {
    this.$$status = PENDING
    this.$$value = undefined
    this.$$callbacks = []

    try {
      executor(this.resolve.bind(this), this.reject.bind(this))
    } catch (err) {
      this.reject(err)
    }
  }

  /**
   * @private
   * @method
   * @name resolve
   * @description
   * 将状态由改变为 FULFILLED，并调用成功的回调函数
   * @param {*} value 异步任务成功后返回的值
   * @returns {void}
   */
  resolve(value) {
    if (this.$$status !== PENDING) {
      // 状态只能改变一次
      return
    }

    this.$$value = value
    this.$$status = FULFILLED

    if (!this.$$callbacks.length) {
      return
    }

    // 通过 then 注册的回调函数都是异步执行的
    setTimeout(() => {
      this.$$callbacks.forEach(cbMap => {
        cbMap.onResolved(value)
      })
    })
  }

  /**
   * @private
   * @method
   * @name reject
   * @description
   * 将状态由改变为 REJECTED，并调用失败的回调函数
   * @param {*} reason 异步任务失败后返回的原因
   * @returns {void}
   */
  reject(reason) {
    if (this.$$status !== PENDING) {
      return
    }

    this.$$value = reason
    this.$$status = REJECTED

    if (!this.$$callbacks.length) {
      // 无回调函数则直接退出
      return
    }

    setTimeout(() => {
      this.$$callbacks.forEach(cbMap => {
        cbMap.onRejected(reason)
      })
    })
  }

  /**
   * @public
   * @method
   * @name then
   * @description
   * 添加成功和失败的回调到当前 promise, 并返回一个新的 promise, 其状态将由回调的执行结果决定
   * @param {Function} onResolved 成功的回调
   * @param {Function | undefined} onRejected 可选的，失败的回调
   * @returns {Promise}
   */
  then(onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            // 错误传透
            throw reason
          }

    const promise2 = new _Promise((resolve, reject) => {
      const handler = cb => {
        try {
          const x = cb(this.$$value)
          if (x instanceof _Promise) {
            if (x === promise2) {
              throw new TypeError(
                'Chaining cycle detected for promise #<Promise>'
              )
            }

            // 如果执行结果返回了一个 Promise 实例对象
            // 则新返回的 promise 的状态由这个返回的 promise 决定
            x.then(resolve, reject)
          } else {
            resolve(x)
          }
        } catch (err) {
          reject(err)
        }
      }

      if (this.$$status === PENDING) {
        this.$$callbacks.push({
          onResolved: () => handler(onResolved),
          onRejected: () => handler(onRejected)
        })
      } else if (this.$$status === FULFILLED) {
        // 牢记通过 then 注册的回调都是异步执行的
        setTimeout(() => {
          handler(onResolved)
        })
      } else {
        setTimeout(() => {
          handler(onRejected)
        })
      }
    })

    return promise2
  }

  /**
   * @public
   * @method
   * @name catch
   * @description
   * 添加一个失败回调到当前 promise
   * @param {Function} onRejected 失败的回调
   * @returns {Promise}
   */
  catch(onRejected) {
    return this.then(undefined, onRejected)
  }

  /**
   * @public
   * @method
   * @name finally
   * @description
   * 在 promise 结束后无论失败都会执行指定的回调，并返回一个 promise
   * @param {Function} onFinally promise 结束后调用的函数
   * @returns {Promise}
   */
  finally(onFinally) {
    return this.then(
      value => _Promise.resolve(onFinally()).then(() => value),
      reason =>
        _Promise.resolve(onFinally()).then(() => {
          throw reason
        })
    )
  }

  /**
   * @public
   * @static
   * @method
   * @name reject
   * @description
   * 返回一个状态为失败的 promise
   * @param {*} reason 失败的原因
   * @returns {Promise}
   */
  static reject(reason) {
    return new _Promise((resolve, reject) => {
      reject(reason)
    })
  }

  /**
   * @public
   * @static
   * @method
   * @name resolve
   * @description
   * 返回一个状态由给定 value 值决定的 promise
   * @param {*} value 给定的 value 值
   * @returns {Promise}
   */
  static resolve(value) {
    return new _Promise((resolve, reject) => {
      // 首先判断得到的值是不是一个对象
      if (
        (typeof value === 'object' && value !== null) ||
        typeof value === 'function'
      ) {
        try {
          const { then } = value
          // 接着进一步确定该值是不是 thenable
          if (typeof then === 'function') {
            then(resolve, reject)
          } else {
            // 普通对象
            resolve(value)
          }
        } catch (err) {
          reject(value)
        }
      } else {
        // 普通值
        resolve(value)
      }
    })
  }

  /**
   * @public
   * @static
   * @method
   * @name race
   * @description
   * 将多个 Promise 实例，包装成一个新的 Promise 实例
   * @param {*} iterable 可迭代对象
   * @returns {Promise}
   */
  static race(iterable) {
    return new _Promise((resolve, reject) => {
      iterable.forEach(item => {
        if (item instanceof _Promise) {
          item.then(resolve, reject)
        } else {
          resolve(item)
        }
      })
    })
  }

  /**
   * @public
   * @static
   * @method
   * @name all
   * @description
   * 将多个 Promise 实例，包装成一个新的 Promise 实例
   * @param {*} iterable 可迭代对象
   * @returns {Promise}
   */
  static all(iterable) {
    return new _Promise((resolve, reject) => {
      let i = 0
      const len = iterable.length
      const values = []

      if (!len) {
        resolve(values)
        return
      }

      /**
       * @private
       * @function
       * @name emitValues
       * @description
       * 将成功的值按照传递的位置存放到最终返回的数组中
       * @param {*} index
       * @param {*} value
       */
      function emitValues(index, value) {
        values[index] = value
        if (++i === len) {
          resolve(values)
        }
      }

      iterable.forEach((item, index) => {
        if (item instanceof _Promise) {
          item.then(curValue => emitValues(index, curValue), reject)
        } else {
          emitValues(index, item)
        }
      })
    })
  }
}
