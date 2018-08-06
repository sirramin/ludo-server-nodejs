const redisClient = require('../../common/redis-client')

module.exports = (io, gameMeta, roomId, marketKey) => {
    const roomPrefix = gameMeta.name + ':rooms:' + roomId

    const sendGameEvents = (code, event, data) => {
        io.to(roomId).emit('gameEvent', {
            code: code,
            event: event,
            data: JSON.stringify(data)
        })
    }

    const sendEventToSpecificSocket = async (userId, code, event, data) => {
        const userData = await redisClient.hget(marketKey, userId),
            socketId = JSON.parse(userData).socketId
        io.to(socketId).emit('gameEvent', {
            code: code,
            event: event,
            data: JSON.stringify(data)
        });
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

    const getAllProps = async () => {
        return await redisClient.HGETALL(roomPrefix)
    }

    const kickUser = async (userId) => {
        const currentpaylers = await redisClient.hget(roomPrefix, 'players')
        const currentpaylersParsed = JSON.parse(currentpaylers)
        if (currentpaylersParsed && currentpaylersParsed.length === 1) {
            destroyRoom()
        }
        else if (currentpaylersParsed.length > 1) {
            await updateUserRoom(roomId, userId)
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

    const updateUserRoom = async (roomId, userId) => {
        const userData = await redisClient.HGET(marketKey, userId)
        const userDataParsed = JSON.parse(userData)
        if (!userDataParsed.roomId)
            userDataParsed.roomId = roomId
        else
            delete userDataParsed.roomId
        await redisClient.hset(marketKey, userDataParsed.userId, JSON.stringify(userDataParsed))
    }

    return {
        sendGameEvents: sendGameEvents,
        sendEventToSpecificSocket: sendEventToSpecificSocket,
        setProp: setProp,
        setMultipleProps: setMultipleProps,
        getProp: getProp,
        getAllProps: getAllProps,
        kickUser: kickUser
    }
}