const express = require('express')
const morgan = require('morgan')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)
const router = express.Router()
global.connections = {}
global.schedulerExecuted = false
const winston = require('winston')
global.logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});
app.use(morgan('combined'))
app.use('/apidoc8574636', express.static('apidoc'))
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const userRouter = require('./components/user/route')(router)
app.use('/user', userRouter)
const charkhonehRouter = require('./components/charkhoneh/route')(router)
app.use('/charkhoneh', charkhonehRouter)
const otpRouter = require('./components/otp/route')(router)
app.use('/otp', otpRouter)
const leaderboardRouter = require('./components/leaderboard/route')(router)
app.use('/leaderboard', leaderboardRouter)
require('./components/realtime/realtime')(router, io)
// app.use('/realtime', realtimeRouter)

// const testRouter = require('./components/test/route')(router)
// app.use('/unitTest', testRouter)
http.listen(3000, () => console.log('app listening on port 3000!'))