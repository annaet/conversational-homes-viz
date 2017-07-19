const request = require('request')
const config = require('../../config')
const endpoint = 'https://' + config.ceStore.url + '/ce-store/'
var store = config.ceStore.store

let getConceptInstances = (req, res) => {
  let thisStore = req.query.store ? req.query.store : store
  console.log('get instances ' + thisStore)

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
  let steps = req.query.steps ? req.query.steps : 2
  console.log('get instance ' + thisStore)
  console.log('get steps ' + steps)

  request.get(endpoint + 'stores/' + thisStore + '/instances/' + req.params.instance + '?style=normalised&steps=' + steps + '&relatedInstances=false', (err, response, body) => {
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
  console.log('get store')
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
  console.log('create store')
  store = req.params.store

  request.post(endpoint + 'stores/' + store, (err, response, body) => {
    if (err) {
      res.status(500).send(err)
    }

    request({
      url: endpoint + 'stores/' + store + '/sentences?action=save',
      method: 'POST',
      body: "perform%20set%20'ce%20root'%20to%20'https%3A%2F%2Frawgit.com%2Fce-store%2Fconv-homes%2Fmaster'.%20%0Aperform%20load%20sentences%20from%20url%20'%2Fce%2Flatest%2Fcmd%2Fload_all.cecmd'."
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
  console.log('send message ' + thisStore)

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
