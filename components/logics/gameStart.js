const _ = require('lodash')
const {numberOfPlayersInRoom, getRoomPlayers, getRoomPlayersWithNames} = require('../redisHelper/players')

const {updateRemainingTime, increaseRemainingTime, updateDiceAttempts, getLights,
  updateCurrentPlayer, getCurrentPlayer, updateLights, updateMarblesPosition} = require('../redisHelper/logic')

const {kickUser, deleteRoom} = require('../redisHelper/room')
const {emitToSpecificPlayer, emitToAll} = require('../realtime/socketHelper')
const {stringBuf} = require('../../flatBuffers/str/data/str')
const {integerBuf} = require('../../flatBuffers/int/data/int')
const {positionBuf} = require('../../flatBuffers/positions/data/positions')
const {gameMeta: {timerMaxTime, lightsAtStart}} = require('../../common/config')
const {changeTurn, findUserId} = require('./gameFunctions')

const init = async (roomId) => {
  const playersCount = await numberOfPlayersInRoom(roomId)
  let lights = []
  for (let i = 0; i < playersCount; i++) {
    lights[i] = lightsAtStart
  }
  updateLights(roomId, lights)
  await sendPositions(roomId)
}

const sendPositions = async (roomId) => {
  const players = await getRoomPlayers(roomId)
  updateRemainingTime(roomId, timerMaxTime)
  updateDiceAttempts(roomId, 0)
  let marblesPosition = []
  for (const [index, userId] of players.entries()) {
    const playerNumber = index + 1
    marblesPosition[index] = [0, 0, 0, 0]
    emitToSpecificPlayer('yourPlayerNumber', userId, integerBuf(playerNumber))
  }
  updateMarblesPosition(roomId, marblesPosition)
  const positions = await getRoomPlayersWithNames(roomId)
  emitToAll('positions', roomId, positionBuf(positions))
  await firstTurn(roomId)
}

const firstTurn = async (roomId) => {
  const playersCount = await numberOfPlayersInRoom(roomId)
  const firstTurn = Math.floor(Math.random() * playersCount)
  await updateCurrentPlayer(roomId, firstTurn)
  emitToAll('firstTurn', roomId, integerBuf(firstTurn))
  const playerUserId = findUserId(roomId, firstTurn)
  emitToSpecificPlayer('yourTurn', playerUserId, null)
  timerCounter(roomId)
}

const timerCounter = (roomId) => {
  const timerInterval = setInterval(async () => {
    const remainingTime = await increaseRemainingTime(roomId, -1)
    const playersCount = await numberOfPlayersInRoom(roomId)
    if ((remainingTime < -1 && playersCount === 1) || remainingTime < -10) {
      clearInterval(timerInterval)
      deleteRoom(roomId)
    }
    // logger.info('roomId: '+ roomId + ' remainingTime: ' + remainingTime)
    if (remainingTime === 0) {
      // if (positions.length === 1) clearInterval(timerInterval)
      const lights = await getLights(roomId)
      const currentPlayer = await getCurrentPlayer(roomId)
      if (lights[currentPlayer - 1] === 1 && playersCount > 1) {
        await kickUser(await findUserId(roomId, currentPlayer))
      } else if (playersCount > 1) {
        await changeTurn(roomId)
      }
    }
  }, 1000)
}

module.exports = init