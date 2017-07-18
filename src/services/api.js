import Vue from 'vue'

export default {
  getInstances (concept, store) {
    return Vue.http
      .get('api/instances/' + concept + '?store=' + store)
  },

  getInstance (instance, store) {
    return Vue.http
      .get('api/instance/' + instance + '?store=' + store)
  },

  getStore (store) {
    return Vue.http
      .get('api/stores/' + store)
  },

  createStore (store) {
    return Vue.http
      .post('api/stores/' + store)
  },

  sendMessage (message, store) {
    return Vue.http
      .post('api/messages', message + '?store=' + store)
  }
}
