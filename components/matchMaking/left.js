
const leftRoom = async (socket) => {
  const userId = socket.userInfo.userId
  await redisHelperUser.removeUserSocketIdFromRedis()
  await redisHelperUser.addDisconnectStatusToUser()
  const userCurrentRoom = await findUserCurrentRoom()
  if (userCurrentRoom) {
    const roomData = await redisClient.hmget(redisConfig.prefixes.rooms + userCurrentRoom, 'players', 'info')
    const currentPlayersParsed = JSON.parse(roomData[0])
    const roomState = JSON.parse(roomData[1]).state
    if (currentPlayersParsed && currentPlayersParsed.length === 1 && roomState === 'waiting') {
      await destroyRoom(userCurrentRoom)
    } else if (currentPlayersParsed && currentPlayersParsed.length > 1) {
      await deleteUserRoom(userId)
      currentPlayersParsed.splice(currentPlayersParsed.indexOf(userId), 1)
      await redisClient.hset(redisConfig.prefixes.rooms + userCurrentRoom, 'players', JSON.stringify(currentPlayersParsed))
      await redisClient.zincrby(redisConfig.prefixes.roomsList, -1, userCurrentRoom)
      io.of('/').adapter.remoteDisconnect(socket.id, true, async (err) => {
        logger.info('---------- remoteDisconnect-------------------')
        const gameLeft = require('../logics/gameLeft')(io, userId, gameMeta, marketKey, userCurrentRoom)
        await gameLeft.handleLeft()
        await methods.addToLeaderboard(userId, false)
        if (currentPlayersParsed.length === 1) {
          await methods.makeRemainingPlayerWinner(userCurrentRoom)
        }
      })
    }
  }
}
