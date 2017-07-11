module.exports = function (app) {
  'use strict'

  app.use('/api', require('./services'))
}
