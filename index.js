const express = require('express')
const morgan = require('morgan')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const redisAdapter = require('socket.io-redis')
const redisOptions = process.env.REDIS_URL ? process.env.REDIS_URL : ''
io.adapter(redisAdapter())
const cors = require('cors')
global.connections = {}
global.schedulerExecuted = false
global.logger = require('./common/logger')
global.redisClient = null
global.redisClientAsync = null
// require('./common/memwatch')
// app.setMaxListeners(0)
app.use(cors())
app.use(morgan('combined'))
const basicAuth = require('basic-auth-connect');
app.use('/docs', [basicAuth('admin', '5179241a'), express.static('apidoc')])
app.use('/static', express.static('static'))
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use('/', require('./common/mainRouter')(io))
require('./components/realtime/realtime')(io)
logger.info('process.env.docker: ' + process.env.docker)
const port = process.env.docker ? 3001 : 3000
http.listen(port, () => {
    logger.info('Server running at http://127.0.0.1:' + port + '. Process PID: ' + process.pid)

    const argv = process.argv.slice(2)
    logger.info('argv: ' + argv)
    if (argv[0] === 'platform-Master' || process.env.dev) {
        const resetHandler = require('./common/reset-handler')(io)
        setTimeout(async () => {
            await resetHandler.findOpenGames()
        }, 3000)
    }
})