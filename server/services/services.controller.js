const request = require('request')
const endpoint = 'http://localhost:8080/ce-store/'

let getConceptInstances = (req, res) => {
  request.get(endpoint + 'concepts/' + req.params.concept + '/instances?style=normalised', (err, response, body) => {
    if (err) {
      console.log(err)
      return
    }

    var json = JSON.parse(body)
    res.send(json)
  })
}

let getInstance = (req, res) => {
  request.get(endpoint + 'instances/' + req.params.instance + '?style=normalised&steps=2&relatedInstances=false', (err, response, body) => {
    if (err) {
      console.log(err)
      return
    }

    var json = JSON.parse(body)
    res.send(json)
  })
}

let sendMessage = (req, res) => {
  request({
    url: endpoint + '/special/hudson/interpreter',
    method: 'POST',
    body: req.body.text
  }, (err, response, body) => {
    if (err) {
      console.log(err)
      return
    }

    var json = JSON.parse(body)
    res.send(json)
  })
}

module.exports = {
  getConceptInstances: getConceptInstances,
  getInstance: getInstance,
  sendMessage: sendMessage
}
