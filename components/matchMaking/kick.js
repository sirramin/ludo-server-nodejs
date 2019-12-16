const {deleteRoom} = require('../redisHelper/room')
const {findUserCurrentRoom, getSocketId, deleteUserRoom} = require('../redisHelper/user')
const {numberOfPlayersInRoom, removePlayerFromRoom} = require('../redisHelper/players')
const {emitToSpecificPlayer, logClientRooms, disconnect} = require('../realtime/socketHelper')
const {stringBuf} = require('../../flatBuffers/str/data/str')
const handleLeft = require('../logics/gameLeft')
const makeRemainingPlayerWinner = require('../logics/gameEnd')
const exp = {}


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
  // const currentPlayers = await numberOfPlayersInRoom(roomId)
  emitToSpecificPlayer('errorMessage', userId, stringBuf('you got kicked'))
  removePlayerFromRoom(roomId, userId)

  // if (currentPlayers.length > 1) {
  // disconnect(userId)
  logClientRooms(userId) //TODO just for debug
  // await handleLeft()
  // await addToLeaderboard(userId, false) //TODO
  // await makeRemainingPlayerWinner(roomId) //TODO
  // }
  await _handleDeleteRoom(roomId)

}

const _handleDeleteRoom = async (roomId) => {
  const playersCount = await numberOfPlayersInRoom(roomId)
  if (playersCount === 1) {
    await deleteRoom(roomId)
  }
}

module.exports = exp
