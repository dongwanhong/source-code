# 原生 JavaScript 实现滑动拖动验证

通常，我们在防止用户恶意提交表单的时候，会让用户在提交前完成滑动拖动验证，有时候这也能起到一丝反爬的作用。

实现滑动验证的方式当然不止一种，这里我们直接使用原生 `JavaScript` 来实现。

## 原生实现

通过原生 `JavaScript` 的实现，主要是通过监听鼠标事件来对 DOM 进行一系列的操作。

滑块验证的结构主要分为四个部分：轨道、滑块、背景和文案，我们可以使用下面的 HTML 结构来表示。

```html
<div class="slide-track">
    <div class="slide-bg"></div>
    <div class="slide-block"></div>
    <p class="slide-text">请按住滑块，拖动到最右边</p>
</div>
```

基本思路就是我们给滑块（`.slide-block`）添加相应的事件，在按下滑块时记录鼠标的当前位置并添加滑动事件，在滑动过程中根据鼠标的移动来移动滑块的位置和增加背景元素（`.slide-bg`）的宽度，直到移动到轨道（`.slide-track`）的末端后，改变文案（`.slide-text`）来提示成功。

### 样式

在开始写脚本之前可以先来完成一下它们的样式，这让滑块相关的部分看起来更好，也让后面的工作更愉快的进行。

```css
/* 样式的注意事项 */
```

样式的写法就不贴了，相信大家一看就懂，而且会有更好的实现。需要的话，也可以在 Github 上找到。

### 脚本

现在开始来实现脚本的内容，首先我们对 `document.querySelector` 方法进行简单的封装以方便后续操作 DOM 元素。

```javascript
function $(selectors) {
    return document.querySelector(selectors);
}
```

然后通过自定义的 `_h` 函数我们可以很方便的创建上面的 HTML 结构，并添加到文档中。

```javascript
function _h(tagName, propMap = {}, text) {
    const ele = document.createElement(tagName);
    Object.keys(propMap).forEach(prop => ele.setAttribute(prop, propMap[prop]));
    if (text) {
        ele.appendChild(document.createTextNode(text));
    }
    return ele;
}

class SlideUnlock {
    constructor(el = "body", options = {}) {
        this.$el = $(el)
        this.$$isSuccess = false
        this.$options = {
            tip: '请按住滑块，拖动到最右边',
            unlockText: '验证成功',
            duration: 500,
            ...options
        }
    }

    init() {
        this.$$root = _h("div", { class: "slide-track" }) // 轨道
        this.$$bg = this.$$root.appendChild(_h("div", { class: "slide-bg" }))
        this.$$block = this.$$root.appendChild(
            _h("div", { class: "slide-block" }) // 滑块
        )
        this.$$text = this.$$root.appendChild(
            _h("p", { class: "slide-text" }, this.$options.tip)
        )
        this.$el.insertBefore(this.$$root, this.$el.firstChild)
    }
}
```

在创建好 DOM 结构后，接下来为滑块添加鼠标按下的事件，在这个事件中我们需要记录下鼠标的初始横坐标，以便后续和滑动过程中的位置相比较，同时为其添加滑动事件。

```javascript
class SlideUnlock {
    init() {
        /* ... */
        this.$$block.addEventListener(
            "mousedown",
            (this.$$handleMouseDown = this._handleMouseDown.bind(this)),
            false
        )
    }

    _handleMouseDown(e) {
        const downx = e.clientX

        e.target.addEventListener(
            "mousemove",
            (this.$$handleMouseMove = this._handleMouseMove.bind(this, downx)),
            false
        )
        e.preventDefault()
    }

    _handleMouseMove(downx, e) {}
}
```

在这里有点细节需要注意：

- 首先，由于事件监听器中的 `this` 指向的是触发事件的元素，为此我们在指定鼠标按下的监听器时为其绑定了 `this`，以便调用滑块实例属性和原型上的方法。
- 其次，我们在鼠标按下的监听器中添加了鼠标移动的监听器，如果在初始时同按下的监听器一起指定，那么会先执行鼠标移动的监听器，而此时并没有记录鼠标的初始位置；

接下来我们要实现滑动过程中的主要逻辑：根据鼠标的移动实时地更新滑块的位置，并对一些临界位置进行处理。

```javascript
_handleMouseMove(downx, e) {
    const info = this.$$block.getBoundingClientRect(),
        x = e.clientX,
        y = e.clientY,
        x1 = info.left,
        y1 = info.top,
        x2 = info.right,
        y2 = info.bottom,
        moveX = x - downx

    if (this.$$isSuccess) {
        return
    }
    if (moveX < 0) {
        return
    }
    if (x < x1 || x > x2 || y < y1 || y > y2) {
        // 当鼠标移开滑块时取消移动
        return
    }

    this.$$block.style.left = `${moveX}px` // 更新滑块的我i之
    this.$$bg.style.width = `${moveX}px` // 同步增大背景元素的宽度

    // 当滑块滑动的距离大于等于轨道除去滑块宽度后的距离时表示已经到达轨道的最右边了
    if (moveX >= this.$$root.offsetWidth - (x2 - x1)) {
        this.$$isSuccess = true
        this.$$text.textContent = "验证成功"
        this.$$text.style.cssText = `color: #fff; left: 0; right: ${this.$$block.offsetWidth}px`
        this.$$block.classList.add("success")
    }
}
```

这里的实现也很简单，唯一需要看一下的就是通过 [getBoundingClientRect][1] 来获取了滑块相对于视口的位置，然后根据鼠标所在的位置来判断鼠标是否在滑块上，如果不在则取消移动。

现在它已经能很好的滑动，并完成提示成功的基本功能了。但是，当我们每次滑动到中间就取消，然后再次点击滑动时，就会导致重复的添加滑动事件，而且中途释放后，滑块就停在了当前位置，这显然不对。

解决的办法就是在添加鼠标按下事件的时候，同时也指定一个松开的事件，在这个事件的监听器中判断如果没有成功则取消之前绑定的滑动事件，并进行重置，为了看起来更友好，我们还可以加上一点动画。

```javascript
class SlideUnlock {
    init() {
        /* ... */
        document.addEventListener(
            "mouseup",
            (this.$$handleMouseUp = this._handleMouseUp.bind(this)),
            false
        )
    }

    _handleMouseDown(e) {
        /* ... */
        // 取消在手动滑动过程中的动画效果
        this.$$bg.style.transition = ""
        this.$$block.style.transition = ""
        /* ... */
    }

    _handleMouseUp(e) {
        this.$$block.removeEventListener(
            "mousemove",
            this.$$handleMouseMove,
            false
        )

        if (this.$$isSuccess) {
            return
        }

        // 给重置过程添加动画效果
        this.$$bg.style.transition = "width 1s ease"
        this.$$block.style.transition = "left 1s ease"

        this.$$block.style.left = 0
        this.$$bg.style.width = 0
    }
}
```

目前为止，滑块已经可以在 PC 端正常的工作了，不过在移动端却并不理想。

为了它能够在移动端也可以很好的工作，我们可以借助 `touchstart`、`touchmove`、`touchend` 等事件来完成。

绑定这些事件的时机和处理方式和之前的三个事件分别相对应，所以我们新增两个方法（和 jQuery 的 on、off 方法很像）来更好的添加和移除事件。

```javascript
function bindEvents(events, handler, element = $("body")) {
    events.split(" ").forEach(event => {
        element.addEventListener(event, handler, false)
    })
}

function unbindEvents(events, handler, element = $("body")) {
    events.split(" ").forEach(event => {
        element.removeEventListener(event, handler, false)
    })
}
```

根据这两个方法，我们来稍微修改一下滑块中添加事件的代码。

```javascript
class SlideUnlock {
    init() {
        /* ... */
        bindEvents(
            "mousedown touchstart",
            (this.$$handleMouseDown = this._handleMouseDown.bind(this)),
            this.$$block
        )
        bindEvents(
            "mouseup touchend",
            (this.$$handleMouseUp = this._handleMouseUp.bind(this)),
            document
        )
    }

    _handleMouseDown(e) {
        /* ... */
        if (e.cancelable) {
            e.preventDefault() // 阻止默认行为
        }

        /* ... */
        bindEvents(
            "mousemove touchmove",
            (this.$$handleMouseMove = this._handleMouseMove.bind(this, downx)),
            this.$$block
        )
    }

    handleMouseUp(e) {
        unbindEvents("mousemove touchmove", this.$$handleMouseMove, this.$$block)
        /* ... */
    }
}
```

<!-- markdownlint-disable MD013 -->
另外，需要注意的是在移动端 `touch` 事件中获取 `clientX`、`clientY` 时不能在事件对象上直接读取，而是在 `event.changedTouches[0]` 对象上取得。
<!-- markdownlint-enable MD013 -->

现在，它已经能够同时在 PC 端和移动端上工作了，不过我们还能对它进行一些优化，比如使用函数节流。

函数节流的实现方式有很多，这里我们列一下在本次中使用的方式。

```javascript
utils.throttle = function(method, context = {}, delay = 4, ...outParams) {
  return function(...innerParams) {
    clearTimeout(context.$$tId)
    context.$$tId = setTimeout(function() {
      method.apply(context, [...outParams, ...innerParams])
    }, delay)
  }
}
```

然后用这个节流函数，来包装我们移动时的处理函数，并根据实际情况做点调整。

除此之外，我们还可以添加一个重置的方法，让它回到最初的状态，涉及到的内容也很简单，就是在成功的状态下重新设置样式和绑定事件。

```javascript
reset() {
    if (!this.$$isSuccess) {
        return
    }
    this.$$isSuccess = false
    this.$$bg.style.cssText =
        `transition: width ${this.$options.duration}ms ease; width: 0;`
    this.$$block.style.cssText =
        `transition: left ${this.$options.duration}ms ease; left: 0;`
    this.$$text.style.cssText =
        `color: #5f5f5f; left: ${this.$$block.offsetWidth}px; right: 0;`
    this.$$text.textContent = this.$options.tip
    this.$$block.classList.remove("success")
    this._bindEvents()
}
```

好了，滑块的实现到这里就告一段落了，相信大家看到这里已经完全明白了，甚至有更好的实现。

这里写下的实现也只是提供一个思路，欢迎大家一起交流学习。

## 如何使用

你可以简单的在 HTML 页面中引入该脚本，然后根据自己的需求设置合适的样式；不过更好的方式是通过这样的思路，在项目中做一些改进（比如平滑降级）等处理。

接下来是一个简单的使用模板。

```html
<body>
    <script src="slide-unlock/core.js"></script>
    <script>
        const slider = new SlideUnlock()
        slider.init()
    </script>
</body>
```

你可以在 [这里](https://dongwanhong.github.io/source-code/slide-unlock/) 看见完整的使用方式和效果。

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect
