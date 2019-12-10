<!-- markdownlint-disable MD041 -->

现在，你可以复制下面的一些示例代码到浏览器的控制台中运行，然后对比原生的 `Promise` 来查看结果。

Q：如何改变 `Promise` 的状态？

A：有三种方式改变，包括：

- 调用 `resolve(value)`： `pending` -> `fulfilled`
- 调用 `reject(reason)`： `pending` -> `rejected`
- 抛出异常，如果当前状态为 `pending`，则 `pending` -> `rejected`

```javascript
new _Promise((resolve, reject) => {
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve(0)
    } else {
      // throw 1
      reject(1)
    }
  }, 1000)
})
  .then(
    value => console.log(value),
    reason => console.log(reason)
  )
  .then(_ => console.log("undefined", _))
```

Q：一个 `Promise` 指定多个成功或失败的调用，在对应状态转变后都会执行吗？

A：会

```javascript
const p = new _Promise((resolve, reject) => {
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve(0)
    } else {
      reject(1)
    }
  }, 1000)
})

p.then(
  value => console.log(`callbackResolved1: ${value}`),
  reason => console.log(`callbackRejected1: ${reason}`)
)

p.then(
  value => console.log(`callbackResolved2: ${value}`),
  reason => console.log(`callbackRejected2: ${reason}`)
)
```

Q：改变 `Promise` 状态和指定回调的顺序？

A：都有可能，通常会先指定回调

Q：如何先改变状态再指定回调？

A：在执行器中同步调用 `resolve/reject`，或者更晚的调用 `then` 方法

```javascript
const p = new _Promise((resolve, reject) => {
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve(0)
    } else {
      // throw 1
      reject(1)
    }
  }, 500)
})

setTimeout(() => {
  p.then(
    value => console.log(value),
    reason => console.log(reason)
  )
}, 1000)
```

Q：何时得到数据？

A：

- 先指定回调的情况，当状态改变时对应的回调会被异步调用，此时可以获取数据
- 先改变状态的情况，当指定回调函数时回调就会被异步调用，此时可以获取数据

Q：`then` 方法返回的新的 `Promise` 的状态是由什么决定的？

A：由通过其指定的回调函数的执行结果决定：

- 如果抛出异常 -> `rejected`
- 如果返回的非 `thenable` -> `resolved`
- 否则，返回的 `Promise` 对象的最终状态由 `then` 方法执行决定

```javascript
new Promise(resolve => resolve())
  .then(
    // then 返回的 Promise 的状态将由下面箭头函数返回的 Promise 决定
    () =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.5) {
            resolve(0)
          } else {
            reject(1)
          }
        }, 1000)
      })
  )
  .then(
    value => console.log(value),
    reason => console.log(reason)
  )
```

Q：`Promise` 如何串联多个操作任务？

A：通过返回一个新的 `Promise` 来实现链式调用

Q：`Promise` 异常的传透？

A：当使用 `Promise` 的链式调用时，可以在链子的最后指定失败的回调，前面任何一个操作出现了异常，都会被传到这个失败回调中进行处理

```javascript
new _Promise((resolve, reject) => {
  setTimeout(() => {
    reject(1)
  }, 500)
})
  .then()
  .catch(err => console.log(err))
```

Q：如何中断 `Promise` 链？

A：如果需要从某个节点开始不再执行后续的回调函数，可以在该节点返回一个状态为 `pending` 且不会改变的 `Promise` 对象

```javascript
new _Promise((resolve, reject) => {
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve(0)
    } else {
      reject(1)
    }
  }, 1000)
})
  .then(() => new _Promise(() => {}))
  .then(value => console.log(value))
  .catch(err => console.log(err)) // 依然可以捕获到错误
```

我们的实现和原生 `Promise` 还是有一点小小的差别的，比如抛出的错误没有处理的话，应该继续抛出到外部。

即便如此，对于我们理解 `Promise` 的运行机制已经有余了。
