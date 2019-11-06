const _ = require('lodash')
const {numberOfPlayersInRoom, getRoomPlayers, getRoomPlayersWithNames} = require('../redisHelper/players')

const {
  updateRemainingTime, increaseRemainingTime, updateDiceAttempts, getLights,
  updateCurrentPlayer, getCurrentPlayer, updateLights, updateMarblesPosition, getPositions
} = require('../redisHelper/logic')

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
  const nextPlayer = await _findNextAvailablePlayer(roomId)
  if (!nextPlayer) {
    return
  }
  await updateCurrentPlayer(roomId, nextPlayer)
  emitToAll('changeTurn', roomId, integerBuf(nextPlayer))
  const playerUserId = await exp.findUserId(roomId, nextPlayer)
  emitToSpecificPlayer('yourTurn', playerUserId, null)
  if (decreaseLight) {
    _decreaseLight()
  }
}

_findNextAvailablePlayer = async (roomId) => {
  const previousPlayer = await getCurrentPlayer(roomId)
  const playersCount = await numberOfPlayersInRoom(roomId)
  const nextPlayer = previousPlayer + 1 > playersCount ? 1 : previousPlayer + 1
  const positions = await getPositions(roomId)
  for (let i = 1; i < playersCount; i++) {
    if (positions[nextPlayer - 1]) {
      return nextPlayer
    }
  }
  return null
}

exp.findUserId = async (roomId, playerNumber) => {
  const positions = await getPositions(roomId)
  const userObj = _.find(positions, function (o) {
    return o.player === playerNumber
  })
  return userObj.userId
}

_decreaseLight = (roomId, lights) => {
  // decrease light in redis
  emitToAll('lights', roomId, arrayBuf(lights))

}

module.exports = exp
