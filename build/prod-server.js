var express = require('express')
var path = require('path')
var serveStatic = require('serve-static')
var bodyParser = require('body-parser')
var cfenv = require('cfenv')

var app = express()
var appEnv = cfenv.getAppEnv()

app.use(bodyParser.json())
app.use(serveStatic(path.join(__dirname, '../dist')))

require('../server/routes')(app)

var port = appEnv.port || process.env.PORT || 3000

app.listen(port)
console.log('server started ' + port)
