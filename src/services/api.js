import Vue from 'vue'

export default {
  getInstances (concept, store) {
    return Vue.http
      .get('api/instances/' + concept + '?store=' + store)
  },

  getInstance (instance, store, steps) {
    let url = 'api/instance/' + instance + '?store=' + store

    if (steps) {
      url += '&steps=' + steps
    }

    return Vue.http
      .get(url)
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
      .post('api/messages?store=' + store, message)
  }
}
