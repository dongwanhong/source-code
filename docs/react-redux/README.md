# React-redux

`Redux` 是 `JavaScript` 状态容器，提供可预测化的状态管理。需要注意的是，它不单单是为 `React` 项目工作，所以针对特定的环境来说并不是很友好。

为了更方便地在 `React` 中使用 `Redux`，于是社区中就出现了 `React-redux`。

## Redux

在进一步学习 `react-redux` 之前，我们先来了解一下仅仅使用 `Redux` 在项目中是怎么工作的，也好比较一下前后的差异。

现在我们来写一个计数器，点击按钮时每次加壹。

```javascript
/*
─store
  action-types.js
  actions.js
  index.js
  reducers.js
*/

/* action-types.js */
export const SYNNC_ADD = 'SYNNC_ADD';

/* action.js */
import { TYPES } from './';

export default {
  syncAdd(value = 1) {
    return {
      type: TYPES.SYNNC_ADD,
      value
    };
  }
};

/* reducers.js */
import { TYPES } from './';

const defaultState = {
  count: 0
};

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case TYPES.SYNNC_ADD:
      return Object.assign({}, state, { count: state.count + action.value });
    default:
      return state;
  }
};

export default reducer;

/* index.js */
import { createStore } from 'redux';
import reducer from './reducers';
import actions from './actions';
import * as TYPES from './action-types';

const store = createStore(reducer);

export { actions, TYPES };
export default store;

/* App.js */
import React from 'react';
import { bindActionCreators } from 'redux';
import store, { actions } from './store';

const boundActionCreators = bindActionCreators(actions, store.dispatch);

class App extends React.Component {
  state = store.getState(); // 获取仓库数据

  constructor(props) {
    super(props);
    // 订阅仓库的数据变化，以更改组件状态
    store.subscribe(() => this.setState(() => store.getState()));
  }

  syncAdd() {
    // 派发动作
    boundActionCreators.syncAdd();
  }

  render() {
    const { state, syncAdd } = this;

    return (
      <>
        <p>{state.count}</p>
        <button onClick={syncAdd}>增加</button>
      </>
    );
  }
}

export default App;
```

在 `App` 组件中，我们首先通过仓库提供的 API 获取了仓库中的数据。然后将修改数据的方法整理到一个对象上，调用仓库提供的 `bindActionCreators` 函数让这些方法具备派发动作的能力。

最后，我们订阅了仓库的数据变化。当仓库的数据发生变化时，更新组件的状态，刷新界面。

如果我们想在另外的组件中借用仓库来管理数据，那么就需要进行重复的步骤。为了让使用变得简单，`React-redux` 借助 `React` 提供的 `Context` 对此部分工作进行了封装。

## Example

接下来，先来看一下结合 `React-redux` 是怎样工作的。首先，我们需要将根组件包括在由 `React-redux` 提供的 `Provider` 组件中。

```javascript
/* 入口文件 */
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import App from './App';

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
```

其次，在 `App` 组件中的使用方式也要做些调整。

```javascript
// App.js
import React from 'react';
import { connect } from 'react-redux';
import { actions } from './store';

class App extends React.Component {
  render() {
    const { count, syncAdd } = this.props;

    return (
      <>
        <p>{count}</p>
        <button onClick={() => syncAdd()}>增加</button>
      </>
    );
  }
}

const mapStateToProps = state => state;

export default connect(mapStateToProps, actions /* mapDispatchToProps */)(App);
```

其中，我们使用了 `React-redux` 提供的 `connect` 函数来包装了我们之前的 `App` 组件。指定的参数包括 `mapStateToProps`（接受仓库的状态作为参数）函数和 `actions` 对象。

这里，前者的返回值和后者身上的方法将被指定到组件的 `props` 上。所以，我们在组件中访问仓库时，不再需要重复的调用方法。同时，也不需要再订阅获取取消订阅仓库状态的变更，这一切都交由 `React-redux` 来处理。

那么它内部究竟是怎么工作的呢？这里主要需要了解 `React-redux` 提供的 `Provide` 组件和 `connect` 函数。

## Context

要理清 `React-redux` 的原理，就需要了解 `React` 中的 `Context`。它提供了一个无需为每层组件手动添加 `props`，就能在组件树间进行数据传递的方法。

现在，先创建一个 `Context` 对象来感受它的作用。当 `React` 渲染一个订阅了这个 `Context` 对象的组件，这个组件会从组件树中离自身最近的那个匹配的 `Provider` 中读取到当前的 `context` 值。

每个 `Context` 对象都会返回一个 `Provider` 组件，它允许消费组件订阅 `context` 的变化。

`Provider` 接收一个 `value` 属性，传递给消费组件。当 `Provider` 的 `value` 值发生变化时，它内部的所有消费组件都会重新渲染。

```javascript
/* Parent.js */
import React from 'react';
import Son from './Son';

const MessageContext = React.createContext();
const { Provider, Consumer } = MessageContext;

class Parent extends React.Component {
  render() {
    return (
      <Provider value='Hello world!'>
        <Son />
      </Provider>
    );
  }
}

export { Consumer };
export default Parent;
```

在子组件中，通过 `Context.Consumer` 组件可以订阅到 `context` 变更。这能让你在函数式组件中完成订阅 `context`。

使用函数组件接收当前的 `context` 值，返回一个 `React` 节点。传递给函数的 `value` 值等同于往上组件树离这个 `context` 最近的 `Provider` 提供的 `value` 值。

```javascript
/* Son.js */
import React from 'react';
import { Consumer } from './Parent';

class Son extends React.Component {
  render() {
    return <Consumer>{value => value}</Consumer>;
  }
}

export default Son;
```

现在 `Context` 的使用已经基本了解了，但要真的理解 `React-redux` 的还需要明白什么是高阶组件。

## HOC

高阶组件（HOC）是 `React` 中用于复用组件逻辑的一种高级技巧。HOC 自身不是 `React` API 的一部分，它是一种基于 `React` 的组合特性而形成的设计模式。

具体而言，高阶组件是参数为组件，返回值为新组件的函数。

这里有一个例子，它可能并不实用。不过我们主要是为了展示高阶组件的真身，其实它并不神秘。

假如，一些组件只要在用户具有特定的权限之后才能访问。为了权限校验的逻辑得到复用，我们可以把这部分内容放在高阶组件中。

```javascript
/* PermissionCheck.js */
import React from 'react';

function checkPersion(permission, ...args) {
  /* 权限校验 */
  return true;
}

function withPermissionCheck(
  WrappedComponent,
  permission = 'PERMISSION_STRING',
  ...args
) {
  return class extends React.Component {
    state = {
      hasPerssion: false
    };

    async componentWillMount() {
      const pass = await checkPersion(permission, ...args);
      this.setState({ hasPerssion: pass });
    }

    render() {
      const { hasPerssion } = this.state;
      return hasPerssion ? (
        <WrappedComponent />
      ) : (
        <div>对不起，您暂无权限访问！</div>
      );
    }
  };
}

export default withPermissionCheck;
```

在使用该组件时，我们可以转入需要权限校验的组件、需要校验怎么样的权限以及校验需要的其它相关信息。最后，高阶组件会根据权限校验的结果来决定如何显示。

比如，现在我们有一个个人中心的页面。只当用户登录后才可以访问该页面，否则就提示没有权限。

```javascript
/* PersonalCenter.js */
export default () => '欢迎来到个人中心！';

/* App.js */
import React from 'react';
import withPermissionCheck from './PermissionCheck';
import PersonalCenter from './PersonalCenter';

const PermissionComponent = withPermissionCheck(PersonalCenter);

class App extends React.Component {
  render() {
    return <PermissionComponent />;
  }
}

export default App;
```

在 `App` 组件中，我们将个人中心的 UI 组件使用高阶组件进行了包裹，如此它便拥有权限校验的功能。当然，对组件进行包裹的逻辑可以组织起来，这样就不需要每次使用时都重新包装一遍。

这里的例子很简单，只是为了演示高阶组件的使用。接下来，我们就来看看 `React-redux` 到底是怎么实现的？

## Provider

在了解了基础知识之后，我们现在就来实现 `React-redux` 提供的 `Provider` 组件。

`Provider` 组件的核心其实就是对 `React` 提供的 `Provider` 组件的封装，所以我们先创建一个专为 `React-redux` 服务的 `Context`，也就是 `ReactReduxContext`。

```javascript
/* context.js */
import { createContext } from 'react';

const ReactReduxContext = createContext();

export default ReactReduxContext;
```

然后，我们新建一个 `Provider` 组件用来包裹 `ReactReduxContext.Provider` 组件。该组件接受一个 `store` 属性，其值将会传递给消费组件消费。

```javascript
/* Provider.js */
import React, { Component } from 'react';
import ReactReduxContext from './context';

class Provider extends Component {
  render() {
    return (
      <ReactReduxContext.Provider value={{ store: this.props.store }}>
        {this.props.children}
      </ReactReduxContext.Provider>
    );
  }
}

export default Provider;
```

新建的 `Provider` 组件看起来并没有什么特别的，只是提供了一个更具识别性的 `store` 属性来接受在组件树间进行传递的数据。为了该组件发挥作用，需要结合 `connect` 函数。

## connect

`connect` 函数接受 `mapStateToProps`、`mapDispatchToProps` 两个作为参数，执行后返回一个新的函数(高阶组件)。这个新的函数将接受一个组件作为参数，再返回一个新的组件。

现在，它看起来是这样的：

```javascript
/* connect.js */
import React from 'react';

function connect(mapStateToProps, mapDispatchToProps) {
  return function(WrappedComponent) {
    return class extends React.Component {};
  };
}

export default connect;
```

接下来我们把挂载在 `class` 上的 `contextType` 属性会重赋值为 `ReactReduxContext` 对象。这样使用 `this.context` 就能消费最近 `Context` 上的值。

紧接着，我们在内部组件中通过用户传入的 `mapStateToProps` 函数获取数据，同步到组件状态中。最后我们再把状态中的数据传递给传入的组件。如此，被包装的组件就可以在 `prop` 上访问到数据。

```javascript
function connect(mapStateToProps, mapDispatchToProps) {
  return function(WrappedComponent) {
    return class extends React.Component {
      static contextType = ReactReduxContext;

      componentDidMount() {
        const updateState = () =>
          this.setState(mapStateToProps(this.context.store.getState()));
        updateState();
      }

      render() {
        return <WrappedComponent {...this.state} />;
      }
    };
  };
}
```

现在，虽然被包裹的组件可以访问到仓库中指定的数据了。但是，当仓库中的数据发生变化时，组件并不会察觉到。因此我们需要借助组件的生命周期函数来订阅/退订仓库的数据变化。

```javascript
function connect(mapStateToProps, mapDispatchToProps) {
  return function(WrappedComponent) {
    return class extends React.Component {
      static contextType = ReactReduxContext;

      componentDidMount() {
        const updateState = () =>
          this.setState(mapStateToProps(this.context.store.getState()));
        updateState();
        this.unsubscribe = this.context.store.subscribe(updateState);
      }

      componentWillUnmount() {
        this.unsubscribe();
      }

      render() {
        return <WrappedComponent {...this.state} />;
      }
    };
  };
}
```

最后，还剩下最后一个问题：被包裹的组件如何来更新仓库中的数据呢？关键就在于 `connect` 函数接受的第二个参数，该参数可以是一个返回对象的函数，也可以只是一个对象。

当这个参数是一个函数时，这个函数将会得到 `store.dispatch` 方法作为参数，这样它就可以向仓库派发动作。同时，函数的返回值也将会被添加到被包裹组件的 `props` 上。

```javascript
function connect(mapStateToProps, mapDispatchToProps) {
  return function(WrappedComponent) {
    return class extends React.Component {
      // ...

      render() {
        let actions = {};
        if (typeof mapDispatchToProps === 'function') {
          actions = mapDispatchToProps(this.context.store.dispatch);
        }

        return <WrappedComponent {...this.state} {...actions} />;
      }
    };
  };
}
```

类似的，当这个参数是一个对象时，对象上的方法将会使用 `bindActionCreator` 进行绑定，在被包裹组件中调用对应的方法时的执行结构将会被仓库的 `dispatch` 函数派发。

```javascript
import React from 'react';
import ReactReduxContext from './context';
import { bindActionCreators } from 'redux';

function connect(mapStateToProps, mapDispatchToProps) {
  return function(WrappedComponent) {
    return class extends React.Component {
      // ...

      render() {
        let actions = {};
        if (typeof mapDispatchToProps === 'function') {
          actions = mapDispatchToProps(this.context.store.dispatch);
        } else if (
          mapDispatchToProps &&
          typeof mapDispatchToProps === 'object'
        ) {
          actions = bindActionCreators(
            mapDispatchToProps,
            this.context.store.dispatch
          );
        }

        return <WrappedComponent {...this.state} {...actions} />;
      }
    };
  };
}

export default connect;
```

## summary

当然，这里的实现只是简单的体现一下 `React-redux` 的原理，并非源码，但是理解之后，对于 `React-redux` 的使用将变得更加应手得心。
