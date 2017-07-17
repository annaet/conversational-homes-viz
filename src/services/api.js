import Vue from 'vue'

export default {
  getInstances (concept) {
    return Vue.http
      .get('api/instances/' + concept)
  },

  getInstance (instance) {
    return Vue.http
      .get('api/instance/' + instance)
  },

  getStore (store) {
    return Vue.http
      .get('api/stores/' + store)
  },

  createStore (store) {
    return Vue.http
      .post('api/stores/' + store)
  },

  sendMessage (message) {
    return Vue.http
      .post('api/messages', message)
  }
}
