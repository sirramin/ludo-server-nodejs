const jwt = require('../../common/jwt'),
    gameIdentifier = require('../../common/gameIdentifier'),
    redisClient = require('../../common/redis-client')

module.exports = (io) => {
    io
        .use(async (socket, next) => {
            if (socket.handshake.query && socket.handshake.query.token) {
                try {
                    const userInfo = await jwt.verifyJwt(socket.handshake.query.token)
                    socket.userInfo = userInfo
                    socket.emit('message', userInfo)
                    socket.emit('message', 'socket id: ' + socket.id)
                    await addSocketIdToRedis(userInfo, socket.id)
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
            logger.info(socket.id)
            const gameMeta = await gameIdentifier.getGameMeta(socket.userInfo.dbUrl)
            const matchMaking = require('./matchMaking')(io, socket, gameMeta)
            socket.on('joinRoom', (message) => {
                logger.info('joined')
                matchMaking.findAvailableRooms()
            })
            socket.on('disconnect', (reason) => {
                matchMaking.kickUserFromRoomByDC()
            })
            mySocket.on('reconnect', () => {
                mySocket.emit('subscribe', 'theRoom')
            })
            socket.on('event', async (msg) => {
                const eventData = JSON.parse(msg)
                logger.info(eventData)
                const marketName = (socket.userInfo.market === 'mtn' || socket.userInfo.market === 'mci') ? socket.userInfo.market : 'market',
                    marketKey = gameMeta.name + ':users:' + marketName,
                    logicEvents = require('../logics/' + gameMeta.name + '/gameEvents')(io, socket, gameMeta, marketKey)
                logicEvents.getAct(eventData)
            })
            socket.on('message', (message) => {
                const messageData = JSON.parse(msg)
                logger.info(messageData)
            })
        })

    const addSocketIdToRedis = async (userInfo, socketId) => {
        const marketName = (userInfo.market === 'mtn' || userInfo.market === 'mci') ? userInfo.market : 'market',
            marketKey = userInfo.dbUrl + ':users:' + marketName,
            userData = await redisClient.hget(marketKey, userInfo.userId),
            userDataParsed = JSON.parse(userData)
        userDataParsed.socketId = socketId
        await redisClient.hset(marketKey, userInfo.userId, JSON.stringify(userDataParsed))
    }
}