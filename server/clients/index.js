var express = require('express')
var controller = require('./clients.controller')

var router = express.Router()

router.get('/clients', controller.get)

module.exports = router
