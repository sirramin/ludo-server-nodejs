const {destroyRoom} = require('../redisHelper/room')
const {findUserCurrentRoom, getSocketId, deleteUserRoom} = require('../redisHelper/user')
const {numberOfPlayersInRoom, removePlayerFromRoom, removeAllPlayerFromRoom} = require('../redisHelper/players')
const {emitToSpecificPlayer, logClientRooms, disconnect, disconnectMultiple} = require('../realtime/socketHelper')
const {stringBuf} = require('../../flatBuffers/str/data/str')
const handleLeft = require('../logics/gameLeft')
const makeRemainingPlayerWinner = require('../logics/winner')
const {getLights} = require('../redisHelper/logic')
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

exp.lightsRanOut = async (userId) => {
  const roomId = await findUserCurrentRoom(userId)
  await _handleLastPlayerWithLight(roomId)

}

const _handleLastPlayerWithLight = async (roomId) => {
  let lights = await getLights(roomId)
  let numberOfPlayersWithLight = 0
  let playerIndex
  for (const [index, light] of lights.entries()) {
    if(light > 0 ) {
      playerIndex = index
      numberOfPlayersWithLight ++
    }
  }
  if (numberOfPlayersWithLight === 1) {
    await makeRemainingPlayerWinner(roomId, playerIndex) //TODO
    destroyRoom(roomId)
  }
}

const _handleLastPlayer = async (roomId) => {
  const playersCount = await numberOfPlayersInRoom(roomId)
  if (playersCount === 1) {
    // make ramaining winner
    destroyRoom(roomId)
  }
}

module.exports = exp
