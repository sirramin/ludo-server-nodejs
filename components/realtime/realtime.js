const jwt = require('../../common/jwt'),
    gameIdentifier = require('../../common/gameIdentifier')
module.exports = (io) => {
    io
        .use(async (socket, next) => {
            if (socket.handshake.query && socket.handshake.query.token) {
                try {
                    const userInfo = await jwt.verifyJwt(socket.handshake.query.token)
                    socket.userInfo = userInfo
                    socket.emit('message', userInfo)
                    socket.emit('message', 'socket id: ' + socket.id)
                    next()
                }
                catch (err) {
                    // socket.emit('message', 'Unauthorized')
                    next('Unauthorized')
                }
            } else {
                next('header token is required!')
            }
        })
        .on('connection', async (socket) => {
            const gameMeta = await gameIdentifier.getGameMeta(socket.userInfo.dbUrl)
            const matchMaking = require('./matchMaking')(io, socket, gameMeta)
            socket.on('joinRoom', (message) => {
                matchMaking.findAvailableRooms()
            })
            socket.on('disconnect', (reason) => {
                matchMaking.kickUserFromRoom()
            })
            socket.on('event', async (act) => {
                const logicEvents = require('../logics/'+ gameMeta.name + '/gameEvents')(io, socket, gameMeta, socket.userInfo)
                logicEvents.getAct(act)
            })
        })
}