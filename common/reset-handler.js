const gameIdentifier = require('../../../common/gameIdentifier'),
    redisClient = require('common/redis-client')


module.exports = () => {

    const findOpenGames = async () => {
        const roomsPrefix = 'menchman:rooms:roomsList'
        const gameMeta = await gameIdentifier.getGameMeta('menchman')
        const args = [roomsPrefix, gameMeta.roomMin, gameMeta.roomMax]
        const availableRooms = await redisClient.ZRANGEBYSCORE(args)
        if (availableRooms.length) {
            for (let j = 1; j <= availableRooms.length; j++) {
                const roomCurrentInfo = await redisClient.HGET(roomsPrefix + availableRooms[j - 1], 'info')
                const roomCurrentInfoParsed = JSON.parse(roomCurrentInfo)
                if (roomCurrentInfoParsed && roomCurrentInfoParsed.state === 'waiting' && roomCurrentInfoParsed.leagueId === leagueId) {
                    return roomCurrentInfoParsed.roomId
                }
            }
        }
        return false
    }

    const logicStart = require('../logics/' + 'menchman' + '/gameStart')(roomId, roomPlayers, roomPlayersWithNames, methods)
    await
    logicStart.sendPositions()

}