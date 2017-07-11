const request = require('request')
const endpoint = 'http://9.180.88.67:1880/'

function getResolvedUrl (service, promises) {
  if (service.url.indexOf('http') > -1) {
    var p = new Promise((resolve, reject) => {
      request.get(service.url, (err, response, body) => {
        if (err) {
          reject()
        } else {
          service.resolved = body
          resolve(body)
        }
      })
    })

    promises.push(p)
  }
}

let get = (req, res) => {
  request.get(endpoint + 'services', (err, response, body) => {
    var json = JSON.parse(body)

    if (json.length) {
      var promises = [];

      for (var i = 0; i < json.length; ++i) {
        var service = json[i]
        getResolvedUrl(service, promises)
      }

      Promise.all(promises).then(() => {
        res.send(json)
      })
    }
  })
}

module.exports = {
  get: get
}
