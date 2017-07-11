import Vue from 'vue'

export default {
  getClients () {
    return Vue.http
      .get('http://leafletjs.com/examples/quick-start/')
      // .get('clients')
  },

  getServices () {
    return Vue.http
      .get('services')
  }
}
