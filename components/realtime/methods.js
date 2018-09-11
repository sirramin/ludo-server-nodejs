const redisClient = require('../../common/redis-client')

module.exports = (io, gameMeta, roomId, marketKey) => {
    const roomPrefix = gameMeta.name + ':rooms:' + roomId,
        roomsListPrefix = gameMeta.name + ':rooms:roomsList',
        market = marketKey.substr(marketKey.indexOf('users:' + 6), marketKey.length),
        leaderboardService = require('../leaderboard/service')(gameMeta.name, market)

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

    const broadcast = async (socket, msg) => {
        socket.broadcast.emit('gameEvent', {
            code: 85,
            event: 'chat',
            data: msg
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
        if(field === 'remainingTime' && number)
        return await redisClient.HINCRBY(roomPrefix, field, number)
    }

    const getAllProps = async () => {
        return await redisClient.HGETALL(roomPrefix)
    }

    const deleteRoom = async (roomId) => {
        await redisClient.DEL(roomPrefix)
        await redisClient.ZREM(roomsListPrefix, roomId)
    }

    const kickUser = async (userId) => {
        const currentPlayers = await getProp('players')
        const socketId = await getUserSocketIdFromRedis(userId)
        if (currentPlayers.length > 1) {
            await updateUserRoom(roomId, userId)
            currentPlayers.splice(currentPlayers.indexOf(userId), 1)
            await redisClient.HSET(roomPrefix, 'players', JSON.stringify(currentPlayers))
            await redisClient.ZINCRBY(roomsListPrefix, -1, roomId)
            await sendEventToSpecificSocket(userId, 203, 'youWillBeKicked', 1)
            io.of('/').adapter.remoteDisconnect(socketId, true, async (err) => {
                const gameLeft = require('../logics/' + gameMeta.name + '/gameLeft')(io, userId, gameMeta, marketKey, roomId)
                await gameLeft.handleLeft()
                logger.info('---------- remoteDisconnect kick-------------------')
                await addToLeaderboard(userId, false)
                if (currentPlayers && currentPlayers.length === 1) {
                    await makeRemainingPlayerWinner(roomId)
                }
            })
        }
    }

    const getUserSocketIdFromRedis = async (userId) => {
        const userDataParsed = JSON.parse(await redisClient.HGET(marketKey, userId))
        return userDataParsed.socketId
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

    const makeRemainingPlayerWinner = async (roomId) => {
        const players = await getProp('players')
        const winnerPlayerNumber = (await getProp('positions'))[0].player
        const winnerId = players[0]
        await setProp('winner', winnerId)
        sendGameEvents(24, 'gameEnd', {
            "winner": winnerPlayerNumber
        })
        await updateUserRoom(roomId, winnerId)
        await addToLeaderboard(winnerId, true)
        const winnerSocketId = await getUserSocketIdFromRedis(winnerId)
        io.of('/').adapter.remoteDisconnect(winnerSocketId, true, (err) => {
            logger.info('---------- remoteDisconnect winner-------------------')
        })
        await deleteRoom(roomId)
        // const roomInfo = await getProp('info')
        // roomInfo.state = 'finished'
        // await setProp('info', JSON.stringify(roomInfo))

    }

    const addToLeaderboard = async (userId, isWinner) => {
        const userDataParsed = JSON.parse(await redisClient.HGET(marketKey, userId))
        const leagueId = (await getProp('info')).leagueId
        await leaderboardService.addScore(userDataParsed.name, userId, leagueId, isWinner)
    }

    return {
        sendGameEvents: sendGameEvents,
        sendEventToSpecificSocket: sendEventToSpecificSocket,
        setProp: setProp,
        setMultipleProps: setMultipleProps,
        getProp: getProp,
        getAllProps: getAllProps,
        kickUser: kickUser,
        incrProp: incrProp,
        makeRemainingPlayerWinner: makeRemainingPlayerWinner,
        broadcast: broadcast,
        addToLeaderboard: addToLeaderboard,
        deleteRoom: deleteRoom
    }
}