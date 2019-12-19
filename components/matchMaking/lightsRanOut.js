const {destroyRoom} = require('../redisHelper/room')
const {findUserCurrentRoom, getSocketId, deleteUserRoom} = require('../redisHelper/user')
const {numberOfPlayersInRoom, removePlayerFromRoom, removeAllPlayerFromRoom} = require('../redisHelper/players')
const {emitToSpecificPlayer, logClientRooms, disconnect, disconnectMultiple} = require('../realtime/socketHelper')
const {stringBuf} = require('../../flatBuffers/str/data/str')
const handleLeft = require('../logics/gameLeft')
const makeRemainingPlayerWinner = require('../logics/winner')
const {getLights} = require('../redisHelper/logic')
const exp = {}

const lightsRanOut = async (userId) => {
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

module.exports = lightsRanOut
