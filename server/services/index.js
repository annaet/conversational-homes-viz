var express = require('express')
var controller = require('./services.controller')

var router = express.Router()

router.get('/instances/:concept', controller.getConceptInstances)
router.get('/instance/:instance', controller.getInstance)
router.post('/messages', controller.sendMessage)

module.exports = router
