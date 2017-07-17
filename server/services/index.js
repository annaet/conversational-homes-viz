var express = require('express')
var controller = require('./services.controller')

var router = express.Router()

router.get('/instances/:concept', controller.getConceptInstances)
router.get('/instance/:instance', controller.getInstance)
router.get('/stores/:store', controller.getStore)
router.post('/stores/:store', controller.createStore)
router.post('/messages', controller.sendMessage)

module.exports = router
