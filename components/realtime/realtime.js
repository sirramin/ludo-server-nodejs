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
            //must merge
            // const isConnectedBefore = await checkIsConnectedBefore(socket.userInfo)
            // const hasRoomBefore = await checkHasRoomBefore(socket.userInfo)
            // if (isConnectedBefore)
            //     await matchMaking.reconnect(hasRoomBefore)
            socket.on('joinRoom', (message) => {
                logger.info('joined')
                matchMaking.findAvailableRooms()
            })
            socket.on('disconnect', (reason) => {
                matchMaking.kickUserFromRoomByDC()
            })
            // socket.on('reconnect', () => {
            //     matchMaking.reconnect()
            // })
            socket.on('event', async (msg) => {
                const eventData = JSON.parse(msg)
                // logger.info(eventData)
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


    const checkIsConnectedBefore = async (userInfo) => {
        const userDataParsed = await getUserInfoFromRedis(userInfo)
        if (userDataParsed && userDataParsed.hasOwnProperty('socketId'))
            return userDataParsed.socketId
        else return false
    }

    const checkHasRoomBefore = async (userInfo) => {
        const userDataParsed = await getUserInfoFromRedis(userInfo)
        if (userDataParsed && userDataParsed.hasOwnProperty('roomId'))
            return userDataParsed.roomId
        else return false
    }

    const addSocketIdToRedis = async (userInfo, socketId) => {
        const marketKey = getMarketKey(userInfo)
        let userDataParsed = await getUserInfoFromRedis(userInfo)
        userDataParsed.socketId = socketId
        await redisClient.hset(marketKey, userInfo.userId, JSON.stringify(userDataParsed))
    }

    const getUserInfoFromRedis = async (userInfo) => {
        const marketKey = getMarketKey(userInfo)
        const userData = await redisClient.hget(marketKey, userInfo.userId),
            userDataParsed = JSON.parse(userData)
        return (userDataParsed)
    }

    const getMarketKey = (userInfo) => {
        const marketName = (userInfo.market === 'mtn' || userInfo.market === 'mci') ? userInfo.market : 'market',
            marketKey = userInfo.dbUrl + ':users:' + marketName
        return marketKey
    }
}