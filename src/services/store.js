let store = null

export default {
  set (newStore) {
    store = newStore
  },

  get () {
    return store
  }
}
