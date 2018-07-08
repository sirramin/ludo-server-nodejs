const express = require('express')
const app = express()
const http = require('http').Server(app);
const io = require('socket.io')(http);

const router = express.Router()
global.connections = {}
app.use('/apidoc8574636', express.static('apidoc'))
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

const userRouter = require('./components/user/route')(router)
app.use('/user', userRouter)
const otpRouter = require('./components/otp/route')(router)
app.use('/otp', otpRouter)
const leaderboardRouter = require('./components/leaderboard/route')(router)
app.use('/leaderboard', leaderboardRouter)
const realtimeRouter = require('./components/realtime/route')(router, io)
app.use('/realtime', realtimeRouter)
// const testRouter = require('./components/test/route')(router)
// app.use('/unitTest', testRouter)
app.listen(3000, () => console.log('app listening on port 3000!'))