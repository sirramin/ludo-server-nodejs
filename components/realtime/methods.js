const redisClient = require('../../common/redis-client')

module.exports = (io, gameMeta, roomId) => {
    const roomPrefix = gameMeta.name + ':rooms:' + roomId,
        marketName = (socket.userInfo.market === 'mtn' || socket.userInfo.market === 'mci') ? socket.userInfo.market : 'market',
        marketKey = gameMeta.name + ':users:' + marketName


    const sendGameEvents = (code, event, data) => {
        io.to(roomId).emit('gameEvents', {
            code: code,
            event: event,
            data: JSON.stringify(data)
        })
    }

    const setProp = async (field, value) => {
        await redisClient.hset(roomPrefix, field, value)
    }

    const setMultipleProps = async (...args) => {
        await redisClient.hmset(roomPrefix, ...args)
    }

    const getProp = async (field) => {
        const value = await redisClient.hget(roomPrefix, field)
        return JSON.parse(value)
    }

    const getMultipleProps = async (...args) => {
        await redisClient.hmget(roomPrefix, ...args)
    }

    const kickUser = async (userId) => {
        const currentpaylers = await redisClient.hget(roomPrefix, 'players')
        const currentpaylersParsed = JSON.parse(currentpaylers)
        if (currentpaylersParsed.length === 1) {
            destroyRoom()
        }
        else if (currentpaylersParsed.length > 1) {
            await updateUserRoom(roomId)
            currentpaylersParsed.splice(currentpaylersParsed.indexOf(userId), 1)
            await redisClient.HSET(roomPrefix, 'players', JSON.stringify(currentpaylersParsed))
            await redisClient.ZINCRBY(roomPrefix, -1, roomId)
        }
        // socket.leave(roomId)
        io.to(roomId).emit('message', {
            code: 4,
            msg: 'player left room'
        })
    }

    const destroyRoom = async () => {
        const roomplayers = await redisClient.hget(roomPrefix, 'players')
        const roomplayersArray = JSON.parse(roomplayers)
        await asyncLoopRemovePlayersRoomInRedis(roomplayersArray)
        await redisClient.DEL(roomPrefix)
        await redisClient.ZREM(roomPrefix)
        io.to(roomId).emit('room destroyed', roomId)
        io.of('/').in(roomId).clients((error, clients) => {
            if (error) logger.error(error)
            if (clients.length) {
                clients.forEach(client => io.of('/').adapter.remoteLeave(client, roomId));
            }
        })
        logger.info(roomId + ' destroyed ')
    }

    const asyncLoopRemovePlayersRoomInRedis = async (roomplayersArray) => {
        for (let i = 0; i < roomplayersArray.length; i++) {
            await updateUserRoom(roomId, roomplayersArray[i])
        }
    }

    const updateUserRoom = async (roomId, user_id) => {
        const userData = await redisClient.HGET(marketKey, user_id)
        const userDataParsed = JSON.parse(userData)
        if (!userDataParsed.roomId)
            userDataParsed.roomId = roomId
        else
            delete userDataParsed.roomId
        await redisClient.hset(marketKey, userDataParsed.userId, JSON.stringify(userDataParsed))
    }

    return {
        sendGameEvents: sendGameEvents,
        setProp: setProp,
        setMultipleProps: setMultipleProps,
        getProp: getProp,
        getMultipleProps: getMultipleProps,
        kickUser: kickUser
    }
}