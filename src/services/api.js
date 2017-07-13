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

  sendMessage (message) {
    console.log(message)
    return Vue.http
      .post('api/messages', message)
  }
}
