const redisClient = require('../../common/redis-client')

module.exports = (io, gameMeta, roomId, marketKey) => {
    const roomPrefix = gameMeta.name + ':rooms:' + roomId,
    roomsListPrefix = gameMeta.name + ':rooms:roomsList'

    const sendGameEvents = (code, event, data) => {
        io.to(roomId).emit('gameEvent', {
            code: code,
            event: event,
            data: data
        })
    }

    const sendEventToSpecificSocket = async (userId, code, event, data) => {
        const userData = await redisClient.hget(marketKey, userId),
            socketId = JSON.parse(userData).socketId
        io.to(socketId).emit('gameEvent', {
            code: code,
            event: event,
            data: data
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

    const incrProp = async (field, number) => {
        return await redisClient.HINCRBY(roomPrefix, field, number)
    }

    const getAllProps = async () => {
        return await redisClient.HGETALL(roomPrefix)
    }

    const kickUser = async (userId) => {
        const currentpaylers = await getProp('players')
        if (currentpaylers && currentpaylers.length === 1) {
            // winner code ---------------
        }
        else if (currentpaylers.length > 1) {
            await updateUserRoom(roomId, userId)
            currentpaylers.splice(currentpaylers.indexOf(userId), 1)
            await redisClient.HSET(roomPrefix, 'players', JSON.stringify(currentpaylers))
            await redisClient.ZINCRBY(roomsListPrefix, -1, roomId)
            // remove from position and marbleposition and send data again ------------------------

        }
        const userData = await redisClient.hget(marketKey, userId)
        const userDataParsed = JSON.parse(userData)
        const socketId = userDataParsed.socketId
        delete userDataParsed[roomId]
        await redisClient.hset(marketKey, userId, JSON.stringify(userDataParsed))
        let socket = io.sockets.connected[socketId]
        io.of('/').adapter.remoteLeave(socket.id, roomId, (err) => {})
        sendGameEvents(203, 'playerLeft', {
            userId: userId
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
        kickUser: kickUser,
        incrProp: incrProp
    }
}