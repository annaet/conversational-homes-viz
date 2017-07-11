var express = require('express')
var controller = require('./services.controller')

var router = express.Router()

router.get('/instances/:concept', controller.getConceptInstances)

module.exports = router
