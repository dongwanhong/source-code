# Promise

`Promise` 是一个对象，它代表了一个异步操作的最终完成或者失败。现在它已经成为了 `JavaScript` 中异步编程的一种重要解决方案，在进一步接触它之前，先来了解一点基本概念。

## 同步和异步

在平时开发过程中我们经常会提到同步和异步的问题。

所谓**同步**就是在发出一个功能调用时，必须等待这个调用返回结果，整个调用才算结束，等待过程中调用发起者不能继续执行后续操作。

```javascript
function sayHello() {
  console.log("Hello world")
}
sayHello()
console.log("End of execution")
// Hello world
// End of execution
```

而**异步**编程在发起调用后，就可以直接执行后续操作，不必等待结果返回。被调用者通过状态、通知来知会调用者，或通过**回调函数**处理这个调用结果。

```javascript
function sayHello() {
  console.log("Hello world")
}
setTimeout(sayHello)
console.log("End of execution")
// End of execution
// Hello world
```

简单来说，同步就是一件一件的完成事情，只有等前一件事完成了才能做下一件事；而异步就像是在发布任务，可以一直发布，而不必关心任务的执行过程。

## 回调函数

那么上面提到的回调函数又是什么呢？

**回调函数**就是一个通过函数指针调用的函数，通常我们将函数作为值通过参数进行传递时就会产生回调。

正如上面所提到的，回调的一大用处就是调用者用来处理异步任务的执行结果。这在我们的开发中经常会见到，尤其是在 `Node.js` 中。

```javascript
const fs = require("fs")

fs.readFile("input.txt", function(err, data) {
  if (err) return console.error(err)
  console.log(data.toString())
})

console.log("End of execution")
```

针对上面同步和异步的概念，其实回调也有同步回调和异步回调之分。

故名思意，同步回调将会被同步调用，比如数组原型上的 `forEach`、`map` 等方法；异步回调也很常见，比如 DOM 事件、定时器函数等。

## 回调地狱

接着回调的功能讲，我们在一些异步任务完成后想要利用结果进一步处理时，最直接和简单的方法就是使用回调，这很好，在一定程度上确实能解决不少问题。

更进一步呢？如果我们在回调函数中又产生了一些异步操作，并且也需要通过这个异步的结果来做些事情，那么就要再增加一层回调了。

也许，这也没什么事，因为也就两层，但是紧接着如此循环的话，将可能导致的更深的层次呢？

毫无疑问，这简直是个噩梦，所以我们把这种情形“亲（坑）切（爹）的”称之为回调地狱。

它，就像下面这样，甚至可以更复杂。

```javascript
fs.readdir(source, function(err, files) {
  if (err) {
    console.log("Error finding files: " + err)
  } else {
    files.forEach(function(filename, fileIndex) {
      console.log(filename)
      gm(source + filename).size(function(err, values) {
        if (err) {
          console.log("Error identifying file size: " + err)
        } else {
          console.log(filename + " : " + values)
          aspect = values.width / values.height
          widths.forEach(
            function(width, widthIndex) {
              height = Math.round(width / aspect)
              console.log(
                "resizing " + filename + "to " + height + "x" + height
              )
              this.resize(width, height).write(
                dest + "w" + width + "_" + filename,
                function(err) {
                  if (err) console.log("Error writing file: " + err)
                }
              )
            }.bind(this)
          )
        }
      })
    })
  }
})
```

更多介绍可以点击查看 [Callback Hell][1]。

所幸，现在我们可以使用 `Promise` 来规避掉回调地狱。

## 更上一层楼

我们先在这里放一个异步的例子，里面包含了一些简单的异步操作，并指定了相应的回调函数，很好的描述了传统异步编程的解决方案。

```javascript
function successCb(value) {
  console.log(value)
  // [async] code ...
}

function failedCb(reason) {
  console.log(reason)
  // [async] code ...
}

function toDo(successCb, failedCb) {
  // other code ...
  setTimeout(() => {
    if (Math.random() > 0.5) {
      successCb(0)
    } else {
      failedCb(1)
    }
  }, 1000)
}

toDo(successCb, failedCb)
```

接者，我们来简单的认识一下 `Promise`。

`Promise` 是 `JavaScript` 提供的一种新的异步编程解决方案，一个显著的例子就是解决了上面所说的回调地狱。

具体的来讲，`Promise` 就是一个对象（通过 new 调用的构造函数），其内封装了一个异步操作，通过它可以获取异步操作的消息。

`Promise` 构造函数总是接受一个函数作为参数，并为此函数提供了 `resolve`、`reject` 两个参数，两者都是函数，用来改变状态并返回值。

对于一个 `Promise` 对象而言，共存在有三种状态：`pending`（进行中）、`fulfilled`（已成功）和 `rejected`（已失败）。

我们需要注意的是，状态的改变只能由进行中转变为另一种状态，而且一旦状态改变，就不会再变。

`Promise` 的初始状态为 `pending`，在其中的异步操作得到结果后我们就可以通过 `resolve` 函数将状态转变为 `fulfilled`，或者调用 `reject` 转为 `rejected` 状态。

然后，我们在外部就可以通过 `Promise` 实例上面的 `then` 方法来进一步处理。

接下来是一个简单的使用示例，是对上面示例的修改。

```javascript
new Promise((resolve, reject) => {
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve(0)
    } else {
      reject(1)
    }
  }, 1000)
}).then(
  value => console.log(value),
  reason => console.log(reason)
)
```

其实可以看出来，`then` 方法就是封装了我们传递回调函数的步骤，但是，传统回调函数的传递只能在任务执行时传入，而使用 `Promise` 后，则可以在后续指定。

另外，需要注意的是 `then` 方法返回了一个新的 `Promise`，因此我们可以进行链式调用，而这就是解决回调地狱的关键。

## 着手实现

`Promise` 的使用，这里就不多提了，重点是接下来如何实现。

在添砖加瓦之前，我们首先将基石打好，在一个自定义的类中列举好整个结构，包括原型和实例上的方法。

```javascript
// 定义三种状态的标识
const PENDING = "PENDING"
const FULFILLED = "FULFILLED"
const REJECTED = "REJECTED"

class _Promise {
  constructor(executor) {
    // 定义基本的实例属性
    this.$$status = PENDING
    this.$$value = undefined // 成功的值或失败的原因
    this.$$callbacks = []
  }
  resolve(value) {}
  reject(reason) {}
  then(onResolved, onRejected) {}
  catch(onRejected) {}
  finally(onFinally) {}
  static all(iterable) {}
  static race(iterable) {}
  static resolve(value) {}
  static reject(reason) {}
}
```

然后，来进一步完善构造函数，目前已经初始化了诸如状态之类的信息，并使用一个数组来存储将来被注册的回调函数，接下来就应该执行传入进来的执行器了（executor）。

在调用执行器之前，需要先来实现两个原型上的辅助函数（resolve、reject），它们负责改变状态和调用相应的回调函数。

这些回调函数都是通过 `then` 方法进行指定的，为了区别成功和失败的回调，我们以对象的数据结构来进行存储，为此我们在这里先使用一个简版的实现。

```javascript
// ...
class _Promise {
  // ...
  then(onResolved, onRejected) {
    this.$$callbacks.push({ onResolved, onRejected })
  }
  // ...
}
```

真正的 `then` 方法不会这么简单，这在后面的实现中会详细介绍，这里只是让我们可以更好的继续进行，现在接着看上面说的两个辅助函数的实现。

```javascript
// ...
class _Promise {
  // ...
  resolve(value) {
    // 状态只能改变一次
    if (this.$$status !== PENDING) {
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
  reject(reason) {}
  // ...
}
```

我们在 `resolve` 方法中改变了状态，并在这之前先对状态进行了检测，一旦状态改变过了，就不再执行后续的操作，否则就调用相应的回调函数。

另一个 `reject` 方法的实现几乎完全一样。

```javascript
// ...
class _Promise {
  // ...
  resolve(value) {
    /* ... */
  }
  reject(reason) {
    if (this.$$status !== PENDING) {
      return
    }
    this.$$value = reason
    this.$$status = REJECTED
    if (!this.$$callbacks.length) {
      return
    }
    setTimeout(() => {
      this.$$callbacks.forEach(cbMap => {
        cbMap.onRejected(reason)
      })
    })
  }
  // ...
}
```

现在，我们回到构造函数中，开始调用执行器。由于执行器可能会执行失败，所以我们需要捕获可能发生的错误，并作为失败处理。

```javascript
class _Promise {
  // ...
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
  // ...
}
```

由于 `resolve` 方法和 `reject` 将会被当作参数进行传递，所以在传递前我们对它们的 `this` 进行了硬绑定，除此之外，一目了然。

到此，我们简易版的 `Promise` 就实现好了，如果操作正常的话，下面的代码已经可以很好的工作了。

```javascript
new _Promise((resolve, reject) => {
  setTimeout(() => {
    if (Math.random() > 0.5) {
      resolve(0)
    } else {
      reject(1)
    }
  }, 1000)
}).then(
  value => console.log(value),
  reason => console.log(reason)
)
```

### then

以上三个函数的实现都比较简单，也好理解，而实现 `then` 方法就相对比较棘手了，它也是整个实现的核心步骤。

接着上面的例子，如果我们将执行器中的异步去掉的话，结果将不会有任何输出。

```javascript
new _Promise((resolve, reject) => {
  if (Math.random() > 0.5) {
    resolve(0)
  } else {
    reject(1)
  }
}).then(
  value => console.log(value),
  reason => console.log(reason)
)
```

为什么会这样呢？由于执行器是同步执行的，当我们通过 `then` 方法添加回调函数时，状态已经改变了。

以目前的实现来看，当状态改变后，就不会再有调用回调函数的地方了，这显然是不对的，而且我们也没有正确的返回新的 `Promise`。

所以，现在我们首先需要返回一个新的 `Promise`，而且在这个新的 `Promise` 中，我们需要根据当前 `Promise` 的状态来决定如何处理正在注册的回调函数:

- 当状态还是 PENDING 时，将回调函数存储到回调数组中；
- 当状态已经变为 FULFILLED 时，异步调用成功的回调；
- 当状态已经变为 REJECTED 时，异步调用失败的回调。

```javascript
// ...
class _Promise {
  // ...
  then(onResolved, onRejected) {
    return new _Promise((resolve, reject) => {
      if (this.$$status === PENDING) {
        this.$$callbacks.push({ onResolved, onRejected })
      } else if (this.$$status === FULFILLED) {
        setTimeout(() => onResolved(this.$$value))
      } else {
        setTimeout(() => onRejected(this.$$value))
      }
    })
  }
  // ...
}
```

看起来好像好很多了，不过还有一个重要的特性并没有实现：新返回的 `Promise` 的状态由回调执行的结果决定，目前我们并没有试着去改变新返回的 `Promise` 的状态。

那么回调的执行结果又是如何影响新返回的 `Promise` 的状态呢？这包括三种情况：

- 当回调执行异常，则新返回的 `Promise` 的状态改为 REJECTED，`reason` 为报错信息；
- 当回调返回的值不是 `Promise` 时，则新返回的 `Promise` 的状态改变为 FULFILLED，`value` 就是回调返回的值；
- 当回调的返回值是 `Promise` 时，则新返回的 `Promise` 的状态由回调返回的 `Promise` 决定。

现在将回调放在 `try...catch` 语句中执行以捕获可能发生的错误，同时需要用一个变量来接受回调执行后返回的值，根据其是否是一个 `Promise` 来进行对应的处理。

```javascript
// ...
class _Promise {
  // ...
  then(onResolved, onRejected) {
    return new _Promise((resolve, reject) => {
      if (this.$$status === PENDING) {
        // ...
      } else if (this.$$status === FULFILLED) {
        setTimeout(() => {
          try {
            const ret = onResolved(this.$$value)
            if (ret instanceof _Promise) {
              // 如果执行结果返回了一个 promise
              // 则新返回的 promise 的状态由这个返回的 promise 决定
              ret.then(resolve, reject)
            } else {
              resolve(ret)
            }
          } catch (err) {
            // 如果出错则以失败处理
            reject(err)
          }
        })
      } else {
        // ...
      }
    })
  }
  // ...
}
```

除了调用的回调需要改为 `onRejected` 外，异步执行错误回调的情况和上面异步执行成功回调完全一致。

那么，到现在我们已经处理了在成功和失败的情况下根据回调执行结果来修改新返回 `Promise` 的状态，可是要是状态还是在 PENDING 呢？

目前我们还只是简单的将回调直接放到了回调队列中，确实它可以在当前 `Promise` 状态改变时执行，但是却和我们要返回的新的 `Promise` 没有任何关联，因此，在将回调加入到队列之前，我们需要进行一层包装。

做法也很简单，就是将指定的回调放在自定义的函数中进行调用（这个调用过程和我们上面处理异步执行成功/错误回调的处理完全一致），然后，我们再将自定义的函数加入到回调队列中。

```javascript
// ...
class _Promise {
  // ...
  then(onResolved, onRejected) {
    return new _Promise((resolve, reject) => {
      if (this.$$status === PENDING) {
        this.$$callbacks.push({
          onResolved: () => {
            try {
              const ret = onResolved(this.$$value)

              // 包装后我们根据情况调用了 resolve 或者 reject 方法
              if (ret instanceof _Promise) {
                ret.then(resolve, reject)
              } else {
                resolve(ret)
              }
            } catch (err) {
              reject(err)
            }
          },
          onRejected: () => {
            try {
              const ret = onRejected(this.$$value)

              if (ret instanceof _Promise) {
                ret.then(resolve, reject)
              } else {
                resolve(ret)
              }
            } catch (err) {
              reject(err)
            }
          }
        })
      } else if (this.$$status === FULFILLED) {
        setTimeout(() => {
          try {
            const ret = onResolved(this.$$value)

            if (ret instanceof _Promise) {
              // 如果执行结果返回了一个 promise
              // 则新返回的 promise 的状态由这个返回的 promise 决定
              ret.then(resolve, reject)
            } else {
              resolve(ret)
            }
          } catch (err) {
            reject(err)
          }
        })
      } else {
        setTimeout(() => {
          try {
            const ret = onRejected(this.$$value)

            if (ret instanceof _Promise) {
              ret.then(resolve, reject)
            } else {
              resolve(ret)
            }
          } catch (err) {
            reject(err)
          }
        })
      }
    })
  }
  // ...
}
```

万幸，它已经能很好的处理同步和异步改变状态的问题了，而且还正确的返回了新的 `Promise`，不过这代码看起来未免也太冗余了，现在来稍稍的做一下改变。

```javascript
// ...
class _Promise {
  // ...
  then(onResolved, onRejected) {
    return new _Promise((resolve, reject) => {
      const handler = cb => {
        try {
          const ret = cb(this.$$value)
          if (ret instanceof _Promise) {
            ret.then(resolve, reject)
          } else {
            resolve(ret)
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
  }
  // ...
}
```

现在看起来好多了，不过，我们知道 `then` 方法是可以只指定一个成功的回调的，而我们直接默认了会接收到两个函数参数，所以还需要做一些对参数的处理。

同时，为了实现错误传透的功效，如果没有指定错误的回调，那么就指定默认的回调，将错误进行传递。

```javascript
// ...
class _Promise {
  // ...
  then(onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    onRejected =
      typeof onRejected === 'function'
        ? onRejected
        : reason => {
            // 错误传透
            throw reason
          }

    return new _Promise((resolve, reject) => {/* ... */}
  }
  // ...
}
```

### catch

终于，我们实现好了核心方法 `then`，接下来的几个方法相对来说就比较简单了。

`catch` 方法添加一个失败(rejection) 回调到当前 `Promise`，然后返回一个新的 `Promise`。

事实上，`catch` 方法可以看作是一个只指定了错误回调了的 `then` 方法。

```javascript
// ...
class _Promise {
  // ...
  catch(onRejected) {
    return this.then(undefined, onRejected)
  }
  // ...
}
```

和 `catch` 相关的还有一个 `finally` 方法，这里的实现引用了阮老师的实现，所以就不多做介绍了。

### reject

前面我们已经实现了原型上的辅助方法 `reject`，现在我们还需要实现 `Pormise` 上同名的静态方法。

`reject` 方法返回一个状态为失败的 `Promise` 对象，并将给定的失败信息传递给对应的处理方法。

根据我们前面的实现，如果需要得到一个失败的 `Promise`，只需要在创建 `Promise` 对象后，再调用它原型上的 `reject` 方法就可以了。

```javascript
// ...
class _Promise {
  // ...
  static reject(reason) {
    return new _Promise((resolve, reject) => {
      reject(reason)
    })
  }
  // ...
}
```

### resolve

与 `reject` 方法相对应的，`resolve` 方法返回一个状态由给定 `value` 值决定的 `Promise` 对象。

如果 `value` 为空，基本类型或者是不带 `then` 方法的对象，返回的 `Promise` 对象状态为 `fulfilled`，并且将该 `value` 传递给对应的 `then` 方法。

如果该值是 `thenable`(即，带有 `then` 方法的对象)，返回的 `Promise` 对象的最终状态由 `then` 方法执行决定。

因此，在处理时我们需要根据传递的值来进行不同的处理。

```javascript
// ...
class _Promise {
  // ...
  static resolve(value) {
    return new _Promise((resolve, reject) => {
      // 首先判断得到的值是不是一个对象
      if (
        (typeof value === "object" && value !== null) ||
        typeof value === "function"
      ) {
        try {
          const then = value.then
          // 接着进一步确定该值是不是 thenable
          if (typeof then === "function") {
            then(resolve, reject)
          } else {
            // 如果不是 thenable，也就是普通对象
            // 则直接将该 value 传递给对应的 then 方法
            resolve(value)
          }
        } catch (err) {
          reject(err)
        }
      } else {
        // 如不不是对象，也就是普通值
        // 则直接将该 value 传递给对应的 then 方法
        resolve(value)
      }
    })
  }
  // ...
}
```

由于对象上的 `then` 方法可能是自定义的，所以进行调用时可能会出错，所以我们把调用部分的代码放在 `try..catch` 语句中，如果捕获到错误则作为失败的原因返回。

通常而言，如果你不知道一个值是否是 `Promise` 对象，就可以使用 `Promise.resolve(value)` 来返回一个 `Promise`，这样就能将该 `value` 以 `Promise` 对象形式使用。

### all

`Promise.all()` 方法接受一个可迭代对象作为参数，然后根据该对象返回一个 `Promise` 实例。

迭代对象中的每一项通常都是 `Promise` 的实例，如果不是的话，就会先调用 `Promise.resolve` 方法，将其转为 `Promise` 实例。

最后返回的实例的状态要等到传递的参数中所有的 `Promise` 成功才会改变为成功状态，并且按照传递的顺序把各个 `Promise` 的返回值以对应的顺序放在一个数组中返回。

在整个等待的过程中，如果其中一个 `Promise` 失败的话，则返回的 `Promise` 直接变为失败状态。

```javascript
// ...
class _Promise {
  // ...
  static all(iterable) {
    return new _Promise((resolve, reject) => {
      let i = 0 // 成功的 Promise 的个数
      const len = iterable.length
      const values = []

      if (!len) {
        resolve(values)
        return
      }

      // 将成功的值按照传递的位置存放到最终返回的数组中
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
  // ...
}
```

需要注意的是，我们在遍历时通过 `index` 保存了每项的位置，在状态改变后将对应的值根据这个位置进行存放，当成功的个数 `i` 与传递进来的个数相等时，就改变最终返回的 `Promise`。

### race

相对 `Promise.all()` 来说 `Promise.race()` 方法就简单了许多。

`Promise.race()` 方法同样接受一个 `iterable` 作为参数，并返回一个 `Promise` 实例。

当 `iterable` 参数里的任意一个子 `Promise` 成功或失败后，父 `Promise` 马上也会用子 `Promise` 的成功返回值或失败详情作为参数调用父 `Promise` 绑定的相应句柄。

```javascript
// ...
class _Promise {
  // ...
  static race(iterable) {
    return _Promise((resolve, reject) => {
      iterable.forEach(item => {
        if (item instanceof _Promise) {
          item.then(resolve, reject)
        } else {
          resolve(item)
        }
      })
    })
  }
  // ...
}
```

现在，大功告成了。

## 链接

- [Callback Hell][1]
- [Promise 对象 - ECMAScript 6入门][2]
- [Promise - JavaScript | MDN][3]
- [Promises/A+][4]

[1]: http://callbackhell.com/
[2]: http://es6.ruanyifeng.com/#docs/promise
[3]: https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise
[4]: https://promisesaplus.com/
