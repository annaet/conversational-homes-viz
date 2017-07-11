import Vue from 'vue'

export default {
  getInstances (concept) {
    return Vue.http
      .get('api/instances/' + concept)
  }
}
