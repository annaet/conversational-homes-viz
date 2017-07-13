let observerCallbacks = []

let notifyObservers = () => {
  observerCallbacks.map(callback => {
    callback()
  })
}

export default {
  registerCallback (callback) {
    observerCallbacks.push(callback)
  },

  update () {
    notifyObservers()
  }
}
