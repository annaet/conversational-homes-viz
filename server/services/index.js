var express = require('express')
var controller = require('./services.controller')

var router = express.Router()

router.get('/services', controller.get)

module.exports = router
