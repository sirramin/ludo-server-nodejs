const gameIdentifier = require('./gameIdentifier'),
    redisClient = require('./redis-client'),
    logicRestartMench = require('../components/logics/' + 'menchman' + '/gameRestart'),
    logicRestartMaster = require('../components/logics/' + 'master-of-minds' + '/gameRestart')

module.exports = (io) => {

    const games = [{gameName: 'menchman', logicRestart: logicRestartMench},
        {gameName: 'master-of-minds', logicRestart: logicRestartMaster}]

    const findOpenGames = async () => {

        games.forEach(async (item) => {
            const roomsPrefix = item.gameName + ':rooms:',
                roomsListPrefix = item.gameName + ':rooms:roomsList',
                userRoomPrefix = item.gameName + ':user_room:market',
                gameMeta = await gameIdentifier.getGameMeta(item.gameName),
                args = [roomsListPrefix, gameMeta.roomMin, gameMeta.roomMax],
                availableRooms = await redisClient.ZRANGEBYSCORE(args)

            logger.info('number of paused rooms for game ' + item.gameName + ': ' + availableRooms.length)
            if (availableRooms.length) {
                for (let j = 1; j <= availableRooms.length; j++) {
                    const roomCurrentInfo = await redisClient.HMGET(roomsPrefix + availableRooms[j - 1], 'info', 'players')
                    const roomCurrentInfoParsed = JSON.parse(roomCurrentInfo[0])
                    const roomCurrentPlayersParsed = JSON.parse(roomCurrentInfo[1])
                    if (roomCurrentInfoParsed && roomCurrentInfoParsed.state === 'started') { // !!! creationDateTime must be affected
                        await joinPlayersToSocketIORoomAgain(roomCurrentPlayersParsed, roomCurrentInfoParsed.roomId, roomCurrentInfoParsed.marketKey)
                        const methods = require('../components/realtime/methods')(io, gameMeta, roomCurrentInfoParsed.roomId, roomCurrentInfoParsed.marketKey)
                        item.logicRestart.handler(roomCurrentInfoParsed.roomId, methods)
                    }
                }
            }
            await deleteUserRoomsForPlayersWhoHasRoomAreUnDeleted(item.gameName, userRoomPrefix, roomsPrefix)
        })
    }

    const joinPlayersToSocketIORoomAgain = async (roomCurrentPlayers, roomId, marketKey) => {
        roomCurrentPlayers.forEach(async (userId) => {
            const userInfo = JSON.parse(await redisClient.HGET(marketKey, userId))
            io.of('/').adapter.remoteJoin(userInfo.socketId, roomId, (err) => {
                logger.info('socketId: ' + userInfo.socketId + ' joined again to room: ' + roomId)
            })
        })
    }

    const deleteUserRoomsForPlayersWhoHasRoomAreUnDeleted = async (gameName, userRoomPrefix, roomsPrefix) => {
        const user_rooms = await redisClient.HGETALL(userRoomPrefix)
        if(user_rooms) {
            const userIds = Object.keys(user_rooms)
            for (let i = 0; i <= userIds.length; i++) {
                const userRoomId = user_rooms[userIds[i]]
                const roomLength = await redisClient.HEXISTS(roomsPrefix + userRoomId, 'positions')
                if (!roomLength)
                    await redisClient.HDEL(userRoomPrefix, userIds[i])
            }
        }
    }

    return {
        findOpenGames: findOpenGames
    }
}