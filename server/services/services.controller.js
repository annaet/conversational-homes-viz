const request = require('request')
const config = require('../../config')
const endpoint = config.ceStore.url
var store = config.ceStore.store

let getConceptInstances = (req, res) => {
  let thisStore = req.query.store ? req.query.store : store
  console.log('use ' + thisStore)

  request.get(endpoint + 'stores/' + thisStore + '/concepts/' + req.params.concept + '/instances?style=normalised', (err, response, body) => {
    if (err) {
      res.status(500).send(err)
    }

    try {
      var json = JSON.parse(body)
      res.send(json)
    } catch (err) {
      res.status(500).send(err)
    }
  })
}

let getInstance = (req, res) => {
  let thisStore = req.query.store ? req.query.store : store
  console.log('use ' + thisStore)

  request.get(endpoint + 'stores/' + thisStore + '/instances/' + req.params.instance + '?style=normalised&steps=2&relatedInstances=false', (err, response, body) => {
    if (err) {
      res.status(500).send(err)
    }

    try {
      var json = JSON.parse(body)
      res.send(json)
    } catch (err) {
      res.status(500).send(err)
    }
  })
}

let getStore = (req, res) => {
  request.get(endpoint + 'stores/' + req.params.store, (err, response, body) => {
    if (err) {
      res.status(404).send('Store not found')
    }

    try {
      var json = JSON.parse(body)
      res.send(json)
    } catch (err) {
      res.status(404).send('Store not found')
    }
  })
}

let createStore = (req, res) => {
  store = req.params.store

  request.post(endpoint + 'stores/' + store, (err, response, body) => {
    if (err) {
      res.status(500).send(err)
    }

    request({
      url: endpoint + 'stores/' + store + '/sentences?action=save',
      method: 'POST',
      body: "perform%20load%20sentences%20from%20url%20'.%2Fce%2Flatest%2Fcmd%2Fload_all.cecmd'."
    }, (err, response, body) => {
      if (err) {
        res.status(500).send(err)
      }

      try {
        var json = JSON.parse(body)
        res.send(json)
      } catch (err) {
        res.status(500).send(err)
      }
    })
  })
}

let sendMessage = (req, res) => {
  let thisStore = req.query.store ? req.query.store : store
  console.log('use ' + thisStore)

  request({
    url: endpoint + 'stores/' + thisStore + '/special/hudson/interpreter',
    method: 'POST',
    body: req.body.text
  }, (err, response, body) => {
    if (err) {
      res.status(500).send(err)
    }

    try {
      var json = JSON.parse(body)
      res.send(json)
    } catch (err) {
      res.status(500).send(err)
    }
  })
}

module.exports = {
  getConceptInstances: getConceptInstances,
  getInstance: getInstance,
  getStore: getStore,
  createStore: createStore,
  sendMessage: sendMessage
}
