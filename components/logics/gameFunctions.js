const _ = require('lodash')
const {numberOfPlayersInRoom} = require('../redisHelper/players')

const {updateRemainingTime, updateDiceAttempts, updateCurrentPlayer, getCurrentPlayer, getPositions, decreaseLights, getLights} = require('../redisHelper/logic')

const {emitToSpecificPlayer, emitToAll} = require('../realtime/socketHelper')
const {integerBuf} = require('../../flatBuffers/int/data/int')
const {arrayBuf} = require('../../flatBuffers/arr/data/arr')
const {gameMeta: {diceMaxTime}} = require('../../common/config')

const exp = {}

exp.changeTurn = async (roomId, decreaseLight) => {
  updateRemainingTime(roomId, diceMaxTime)
  updateDiceAttempts(roomId, 0)
  const previousPlayer = await getCurrentPlayer(roomId)
  const nextPlayer = await _findNextAvailablePlayer(roomId, previousPlayer)
  if (!nextPlayer) {
    return
  }
  await updateCurrentPlayer(roomId, nextPlayer)
  emitToAll('changeTurn', roomId, integerBuf(nextPlayer))
  const playerUserId = await exp.findUserId(roomId, nextPlayer)
  emitToSpecificPlayer('yourTurn', playerUserId, null)
  if (decreaseLight) {
    await _decreaseLight(roomId, previousPlayer)
  }
}

_findNextAvailablePlayer = async (roomId, previousPlayer) => {
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

_decreaseLight = async (roomId, playerNumber) => {
  const {kickUser} = require('../matchMaking/kick')
  await decreaseLights(roomId, playerNumber)
  let lights = await getLights(roomId)
  emitToAll('lights', roomId, arrayBuf(lights))
  const playersCount = await numberOfPlayersInRoom(roomId)
  if (lights[playerNumber - 1] === 1 && playersCount > 1) {
    kickUser(await exp.findUserId(roomId, playerNumber))
  }
}

module.exports = exp
