const redisClient = require('../../common/redis-client')

module.exports = (io, roomId) => {
    const roomPrefix = gameMeta.name + ':rooms:' + roomId,
        roomsListPrefix = gameMeta.name + ':rooms:roomsList',
        market = marketKey.substr(marketKey.indexOf('users:') + 6, marketKey.length),
        userRoomPrefix = gameMeta.name + ':user_room:' + market,
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

    const incrProp = async (field, number) => {
        return await redisClient.hincrby(roomPrefix, field, number)
    }

    const getAllProps = async () => {
        return await redisClient.hgetall(roomPrefix)
    }

    const deleteRoom = async (roomId) => {
        await redisClient.del(roomPrefix)
        await redisClient.zrem(roomsListPrefix, roomId)
    }

    const kickUser = async (userId) => {
        const currentPlayers = await getProp('players')
        const socketId = await getUserSocketIdFromRedis(userId)
        if (currentPlayers.length > 1) {
            await deleteUserRoom(userId)
            currentPlayers.splice(currentPlayers.indexOf(userId), 1)
            await redisClient.hset(roomPrefix, 'players', JSON.stringify(currentPlayers))
            await redisClient.zincrby(roomsListPrefix, -1, roomId)
            await sendEventToSpecificSocket(userId, 203, 'youWillBeKicked', 1)
            io.of('/').adapter.remoteDisconnect(socketId, true, async (err) => {
                const gameLeft = require('../logics/' + gameMeta.name + '/gameLeft')(userId, roomId)
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
        const userDataParsed = JSON.parse(await redisClient.hget(marketKey, userId))
        return userDataParsed.socketId
    }

    // const updateUserRoom = async (roomId, anyUserId) => {
    //     const user_id = anyUserId ? anyUserId : userId
    //     return await redisClient.hset(userRoomPrefix, user_id, roomId)
    // }

    const deleteUserRoom = async (userId) => {
        return await redisClient.hdel(userRoomPrefix, userId)
    }

    const makeRemainingPlayerWinner = async (roomId) => {
        const players = await getProp('players')
        const positions = await getProp('positions')
        const info = await getProp('info')
        // if(positions && positions.length) {
        const winnerPlayerNumber = positions[0].player
        const winnerId = players[0]
        await setProp('winner', winnerId)
        sendGameEvents(24, 'gameEnd', {
            "winner": winnerPlayerNumber
        })
        await deleteUserRoom(winnerId)
        await addToLeaderboard(winnerId, true)
        await givePrize(winnerId, info.leagueId)
        const winnerSocketId = await getUserSocketIdFromRedis(winnerId)
        io.of('/').adapter.remoteDisconnect(winnerSocketId, true, (err) => {
            logger.info('---------- remoteDisconnect winner-------------------')
        })
        await deleteRoom(roomId)
        // const roomInfo = await getProp('info')
        // roomInfo.state = 'finished'
        // await setProp('info', JSON.stringify(roomInfo))
        // }
    }

    const addToLeaderboard = async (userId, isWinner) => {
        const roomInfo = await getProp('info')
        const userDataParsed = JSON.parse(await redisClient.hget(marketKey, userId))
        if (roomInfo && roomInfo.hasOwnProperty('leagueId')) {
            const leagueId = roomInfo.leagueId
            await leaderboardService.addScore(userDataParsed.name, userId, leagueId, isWinner)
        }
    }

    const getleaderboardRank = async (userId) => {
        return await leaderboardService.getRank(userId)
    }

    const getUserData = async (userId) => {
        return JSON.parse(await redisClient.hget(marketKey, userId))
    }

    const givePrize = async (userId, leagueId) => {
        return await leaderboardService.givePrize(userId, leagueId)
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
        deleteRoom: deleteRoom,
        getleaderboardRank: getleaderboardRank,
        getUserData: getUserData,
        deleteUserRoom: deleteUserRoom,
        givePrize: givePrize
    }
}