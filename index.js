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
const winston = require('winston')
global.logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new (winston.transports.Console)({timestamp: true}),
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'})
    ]
})
app.use(cors())
app.use(morgan('combined'))
app.use('/apidoc8574636', express.static('apidoc'))
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use('/', require('./common/mainRouter')(io));
require('./components/realtime/realtime')(io)
// app.use('/realtime', realtimeRouter)

// const testRouter = require('./components/test/route')(router)
// app.use('/unitTest', testRouter)
http.listen(3000, () => logger.info('app listening on port 3000!'))