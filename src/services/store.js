let store = 'DEFAULT'

export default {
  set (newStore) {
    store = newStore
  },

  get () {
    return store
  }
}
