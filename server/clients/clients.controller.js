const request = require('request')
const endpoint = 'http://itactaportal:41880/'

let get = (req, res) => {
  request.get(endpoint + 'clients', (err, response, body) => {
    res.send(body)
  })
}

module.exports = {
  get: get
}
