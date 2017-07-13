// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import VueResource from 'vue-resource'

import App from './App'
import router from './router'

import Floorplan from './components/Floorplan.vue'
import Chatbox from './components/Chatbox.vue'
Vue.component('floorplan', Floorplan)
Vue.component('chatbox', Chatbox)

Vue.use(VueResource)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  template: '<App/>',
  components: { App }
})
