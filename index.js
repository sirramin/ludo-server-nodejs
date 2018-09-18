const express = require('express')
const morgan = require('morgan')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const redisAdapter = require('socket.io-redis')
io.adapter(redisAdapter({host: 'localhost', port: 6379}))
const cors = require('cors')
global.connections = {}
global.schedulerExecuted = false
global.logger = require('./common/logger')
global.redisClient = null
global.redisClientAsync = null
// require('./common/memwatch')
require('./common/reset-handler')(io)
// app.setMaxListeners(0)
app.use(cors())
app.use(morgan('combined'))
app.use('/apidoc8574636', express.static('apidoc'))
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use('/', require('./common/mainRouter')(io))
require('./components/realtime/realtime')(io)
const port = 3000
http.listen(port, () => logger.info('Server running at http://127.0.0.1:'+ port + '. Process PID: ' + process.pid))