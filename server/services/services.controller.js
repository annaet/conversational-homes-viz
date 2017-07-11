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

module.exports = {
  getConceptInstances: getConceptInstances
}
