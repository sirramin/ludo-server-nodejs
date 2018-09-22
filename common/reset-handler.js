const gameIdentifier = require('./gameIdentifier'),
    redisClient = require('./redis-client'),
    logicRestart = require('../components/logics/' + 'menchman' + '/gameRestart')


module.exports = (io) => {

    const findOpenGames = async () => {
        const roomsPrefix = 'menchman' + ':rooms:',
            roomsListPrefix = 'menchman' + ':rooms:roomsList',
            gameMeta = await gameIdentifier.getGameMeta('menchman'),
            args = [roomsListPrefix, gameMeta.roomMin, gameMeta.roomMax],
            availableRooms = await redisClient.ZRANGEBYSCORE(args)

        logger.info('number of paused rooms: ' + availableRooms.length)
        if (availableRooms.length) {
            for (let j = 1; j <= availableRooms.length; j++) {
                const roomCurrentInfo = await redisClient.HMGET(roomsPrefix + availableRooms[j - 1], 'info', 'players')
                const roomCurrentInfoParsed = JSON.parse(roomCurrentInfo[0])
                const roomCurrentPlayersParsed = JSON.parse(roomCurrentInfo[1])
                if (roomCurrentInfoParsed && roomCurrentInfoParsed.state === 'started') { // !!! creationDateTime must be affected
                    await joinPlayersToSocketioRoomAgain(roomCurrentPlayersParsed, roomCurrentInfoParsed.roomId, roomCurrentInfoParsed.marketKey)
                    const methods = require('../components/realtime/methods')(io, gameMeta, roomCurrentInfoParsed.roomId, roomCurrentInfoParsed.marketKey)
                    logicRestart.handler(roomCurrentInfoParsed.roomId, methods)
                }
            }
        }
    }

    const joinPlayersToSocketioRoomAgain = (roomCurrentPlayers, roomId, marketKey) => {
        roomCurrentPlayers.forEach(async (userId) => {
            const userInfo = JSON.parse(await redisClient.HGET(marketKey, userId))
            io.of('/').adapter.remoteJoin(userInfo.socketId, roomId, (err) => {
                logger.info('socketId: ' + userInfo.socketId + ' joined again to room: ' + roomId)
            })
        })
    }

    return {
        findOpenGames: findOpenGames
    }
}