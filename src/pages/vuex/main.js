import Vuex from './js/core'
import utils from '@utils'
import '@styles/index.less'
import './styles/index.less'

utils.createTab()
utils.createCard()

utils.$('.tab-pane:nth-child(1)').appendChild(utils.h('div', { id: 'root' }))

const store = new Vuex.Store({
  state: {
    count: 10
  },
  getters: {
    computedCount(localState) {
      return localState.count + 2
    }
  },
  mutations: {
    syncAdd(localState, payload) {
      localState.count += payload
    }
  },
  actions: {
    asyncAdd({ commit }) {
      setTimeout(() => commit('syncAdd', 10), 1000)
    }
  }
})

const { Vue } = window // fix lint: no-undef

Vue.use(Vuex)

new Vue({
  name: 'app',
  template: `
  <div id="app">
    state.count: {{ $store.state.count }}
    <br />
    getters.computedCount: {{ $store.getters.computedCount }}

    <br />
    <br />
    <button class="btn button" @click="syncAdd">syncAdd +10</button>
    <button class="btn button" @click="asyncAdd">asyncAdd +10</button>
  </div>
  `,
  store,
  methods: {
    syncAdd() {
      this.$store.commit('syncAdd', 10)
    },
    asyncAdd() {
      this.$store.dispatch('asyncAdd', 10)
    }
  }
}).$mount('#root')
