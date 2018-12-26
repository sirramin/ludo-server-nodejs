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
            const monitor = require('socket.io-monitor')
            const {emitter} = monitor.bind(io, {server: false})
            emitter.getState()
            emitter.on('join', ({id, rooms}) => logger.info('socket id: ' + id + ' joins room: ' + rooms))

            logger.info('socket.id connected:' + socket.id)
            const gameMeta = await gameIdentifier.getGameMeta(socket.userInfo.dbUrl)
            const matchMaking = require('./matchMaking')(io, socket, gameMeta)
            const friendly = require('./friendly')(io, socket, gameMeta)
            await addOnlineStatus(socket.userInfo, true)
            //must merge
            const isConnectedBefore = await checkIsConnectedBefore(socket.userInfo, gameMeta)
            if (isConnectedBefore) {
                await matchMaking.changeSocketIdAndSocketRoom()
                // const hasRoomBefore = await checkHasRoomBefore(socket.userInfo)
                // if (hasRoomBefore) matchMaking.returnUserToGame(hasRoomBefore)      //hasRoomBefore = roomId
            }
            socket.on('joinRoom', async (leagueId) => {
                await matchMaking.findAvailableRooms(leagueId)
            })
            socket.on('invite', async (usernamesArray) => {
                await friendly.invite(usernamesArray)
            })
            socket.on('joinFriendly', async (usernamesArray) => {
                await friendly.invite(usernamesArray)
            })
            socket.on('leftRoom', async () => {
                await matchMaking.leftRoom()
            })
            socket.on('disconnect', async (reason) => {
                await addOnlineStatus(socket.userInfo, false)
                await matchMaking.kickUserFromRoomByDC()
            })
            socket.on('event', async (msg) => {
                const eventData = JSON.parse(msg)
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

    const addOnlineStatus = async (userInfo, status) => {
        // const userDataParsed = await getUserInfoFromRedis(userInfo)
        // userDataParsed.online = status
        const marketKey = getMarketKey(userInfo)
        if (status)
            await redisClient.sadd(marketKey + ':online', userInfo.userId)
        else
            await redisClient.srem(marketKey + ':online', userInfo.userId)
    }

    const checkIsConnectedBefore = async (userInfo, gameMeta) => {
        const userDataParsed = await getUserInfoFromRedis(userInfo)
        const userRoom = await getUserRoomFromRedis(userInfo, gameMeta)
        if (userDataParsed && userDataParsed.hasOwnProperty('dc') || userRoom)
            return userDataParsed.socketId
        else return false
    }

    // const checkHasRoomBefore = async (userInfo) => {
    //     const userDataParsed = await getUserInfoFromRedis(userInfo)
    //     if (userDataParsed && userDataParsed.hasOwnProperty('roomId'))
    //         return userDataParsed.roomId
    //     else return false
    // }

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
        return userDataParsed
    }

    const getUserRoomFromRedis = async (userInfo, gameMeta) => {
        const marketName = (userInfo.market === 'mtn' || userInfo.market === 'mci') ? userInfo.market : 'market',
            userRoomPrefix = gameMeta.name + ':user_room:' + marketName
        const userRoom = await redisClient.hget(userRoomPrefix, userInfo.userId)
        return userRoom
    }

    const getMarketKey = (userInfo) => {
        const marketName = (userInfo.market === 'mtn' || userInfo.market === 'mci') ? userInfo.market : 'market',
            marketKey = userInfo.dbUrl + ':users:' + marketName
        return marketKey
    }
}