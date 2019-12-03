const {findUserCurrentRoom, getSocketId, deleteUserRoom} = require('../redisHelper/user')
const {numberOfPlayersInRoom, removePlayerFromRoom} = require('../redisHelper/players')
const {emitToSpecificPlayer} = require('../realtime/socketHelper')
const {stringBuf} = require('../../flatBuffers/str/data/str')

const kickUserByDC = async (socket) => {
  const userId = socket.userInfo.userId
  await redisHelperUser.removeUserSocketIdFromRedis()
  await redisHelperUser.addDisconnectStatusToUser()
  const userCurrentRoom = await redisHelperUser.findUserCurrentRoom(socket.userId)
  if (userCurrentRoom) {
    setTimeout(async () => {
      const userDataParsed = await redisHelperUser.getUserData(userId)
      if (userDataParsed && userDataParsed.hasOwnProperty('dc') && userDataParsed.dc) {
        const roomData = await redisClient.hmget(redisConfig.prefixes.rooms + userCurrentRoom, 'players', 'info')
        if (roomData[0]) {
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
              await gameLeft.handleLeft()
              await redisHelperLeaderboard.addToLeaderboard(userId, false)
              if (currentPlayersParsed.length === 1) {
                await matchMakingHelper.makeRemainingPlayerWinner(userCurrentRoom)
              }
            })
          }
        }
      }
    }, gameMeta.kickTime)
  }
}

exp.kickUser = async (userId) => {
  const roomId = await findUserCurrentRoom(userId)
  const currentPlayers = await numberOfPlayersInRoom(roomId)
  const socketId = await getSocketId(userId)
  emitToSpecificPlayer('errorMessage', userId, stringBuf('you got kicked'))
  removePlayerFromRoom(roomId, userId)

    if (currentPlayers.length > 1) {
    io.of('/').adapter.remoteDisconnect(socketId, true, async (err) => {
      const gameLeft = require('../logics/' + gameMeta.name + '/gameLeft')(userId, roomId)
      await gameLeft.handleLeft()
      // await addToLeaderboard(userId, false)
      if (currentPlayers && currentPlayers.length === 1) {
        await makeRemainingPlayerWinner(roomId)
      }
    })
  }
}
