const _ = require('lodash')
const {numberOfPlayersInRoom, getRoomPlayers, getRoomPlayersWithNames} = require('../redisHelper/players')
const {updateRemainingTime, increaseRemainingTime, updateDiceAttempts, updateCurrentPlayer, getCurrentPlayer} = require('../redisHelper/logic')
const {kickUser} = require('../redisHelper/room')
const {emitToSpecificPlayer, emitToAll} = require('../realtime/socketHelper')
const {stringBuf} = require('../../flatBuffers/str/data/str')
const {integerBuf} = require('../../flatBuffers/int/data/int')
const {positionBuf} = require('../../flatBuffers/positions/data/positions')
const {gameMeta: {timerMaxTime, lightsAtStart}} = require('../../common/config')

const exp = {}

exp.changeTurn = async (roomId, decreaseLight) => {
  updateRemainingTime(roomId, timerMaxTime)
  updateDiceAttempts(roomId, 0)
  currentPlayer = await getCurrentPlayer()
  const previousPlayer = currentPlayer
  const playersCount = await numberOfPlayersInRoom(roomId)
  const nextPlayer = previousPlayer + 1 > playersCount ? 1 : previousPlayer + 1
  if (lights[nextPlayer - 1] > 0) {
    lights[previousPlayer] -= 1
    updateCurrentPlayer(roomId, nextPlayer)
    emitToAll('changeTurn', roomId, integerBuf(nextPlayer))
    redisHelperRoom.sendGameEvents(104, 'changeTurn', {
      "lights": lights
    })
    const playerUserId = findUserId()
    await redisHelperRoom.sendEventToSpecificSocket(playerUserId, 201, 'yourTurn', 1)
    if(updateCurrentPlayer){
      _decreaseLight()
    }
  }
}

_decreaseLight = (roomId) => {
  // decrease light in redis
  emitToAll('lights', roomId, integerBuf(firstTurn))

}

module.exports = exp
