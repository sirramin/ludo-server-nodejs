const _ = require('lodash')
const {numberOfPlayersInRoom, getRoomPlayers, getRoomPlayersWithNames} = require('../redisHelper/players')
// const deleteRoomCycle = require('../redisHelper/deleteRoom')

const {
  updateRemainingTime, increaseRemainingTime, updateDiceAttempts, getLights,
  updateCurrentPlayer, getCurrentPlayer, initLights, updateMarblesPosition, updatePositions
} = require('../redisHelper/logic')

const {emitToSpecificPlayer, emitToAll} = require('../realtime/socketHelper')
const {integerBuf} = require('../../flatBuffers/int/data/int')
const {positionBuf} = require('../../flatBuffers/positions/data/positions')
const {gameMeta: {diceMaxTime, lightsAtStart}} = require('../../common/config')
const {changeTurn, findUserId} = require('./gameFunctions')
// const {kickUser} = require('../matchMaking/kick')

const init = async (roomId) => {
  const playersCount = await numberOfPlayersInRoom(roomId)
  let lights = []
  for (let i = 0; i < playersCount; i++) {
    lights[i] = lightsAtStart
  }
  initLights(roomId, lights)
  await sendPositions(roomId)
}

const sendPositions = async (roomId) => {
  const players = await getRoomPlayers(roomId)
  updateRemainingTime(roomId, diceMaxTime)
  updateDiceAttempts(roomId, 0)
  let marblesPosition = []
  for (const [index, userId] of players.entries()) {
    const playerNumber = index + 1
    marblesPosition[index] = [0, 0, 0]
    emitToSpecificPlayer('yourPlayerNumber', userId, integerBuf(playerNumber))
  }
  await updateMarblesPosition(roomId, marblesPosition)
  const positions = await getRoomPlayersWithNames(roomId)
  await updatePositions(roomId, positions)
  emitToAll('positions', roomId, positionBuf(positions))
  await firstTurn(roomId)
}

const firstTurn = async (roomId) => {
  const playersCount = await numberOfPlayersInRoom(roomId)
  const firstTurn = _.random(1, playersCount)
  updateCurrentPlayer(roomId, firstTurn)
  emitToAll('firstTurn', roomId, integerBuf(firstTurn))
  const playerUserId = await findUserId(roomId, firstTurn)
  emitToSpecificPlayer('yourTurn', playerUserId, null)
  timerCounter(roomId)
}

const timerCounter = (roomId) => {
  const timerInterval = setInterval(async () => {
    const playersCount = await numberOfPlayersInRoom(roomId)
    let remainingTime
    if (playersCount > 1) {
      remainingTime = await increaseRemainingTime(roomId, -1)
      if (remainingTime === 0) {
        changeTurn(roomId, true)
      }
    } else if (playersCount === 1) {
      clearInterval(timerInterval)
    }
  }, 1000)
}

module.exports = init