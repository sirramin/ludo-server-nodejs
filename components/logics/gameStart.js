const _ = require('lodash')
const {numberOfPlayersInRoom, getRoomPlayers, getRoomPlayersWithNames} = require('../redisHelper/players')
const {updateRemainingTime, increaseRemainingTime, updateDiceAttempts, updateCurrentPlayer, getCurrentPlayer} = require('../redisHelper/logic')
const {kickUser} = require('../redisHelper/room')
const {emitToSpecificPlayer, emitToAll} = require('../realtime/socketHelper')
const {stringBuf} = require('../../flatBuffers/str/data/str')
const {integerBuf} = require('../../flatBuffers/int/data/int')
const {positionBuf} = require('../../flatBuffers/positions/data/positions')
const {gameMeta: {timerMaxTime, lightsAtStart}} = require('../../common/config')
const {changeTurn} = require('./gameFunctions')

let positions = []
let marblesPosition = []
let lights = []
let currentPlayer

const init = async (roomId) => {
  const playersCount = await numberOfPlayersInRoom(roomId)
  for (let i = 0; i < playersCount; i++) {
    lights[i] = lightsAtStart
  }
  await sendPositions(roomId)
}

const sendPositions = async (roomId) => {
  const players = await getRoomPlayers(roomId)
  updateRemainingTime(roomId, timerMaxTime)
  updateDiceAttempts(roomId, 0)
  for (const [index, userId] of players.entries()) {
    const playerNumber = index + 1
    marblesPosition[index] = [0, 0, 0, 0]
    emitToSpecificPlayer('yourPlayerNumber', userId, integerBuf(playerNumber))
  }
  positions = await getRoomPlayersWithNames(roomId)
  emitToAll('positions', roomId, positionBuf(positions))
  await firstTurn(roomId)
}

const firstTurn = async (roomId) => {
  const playersCount = await numberOfPlayersInRoom(roomId)
  const rand = Math.floor(Math.random() * playersCount)
  const firstTurn = positions[rand].player
  currentPlayer = firstTurn
  await updateCurrentPlayer(roomId, currentPlayer)
  emitToAll('firstTurn', roomId, integerBuf(firstTurn))
  const playerUserId = findUserId()
  emitToSpecificPlayer('yourTurn', playerUserId, null)
  timerCounter(roomId)
}

const timerCounter = (roomId) => {
  const timerInterval = setInterval(async () => {
    const remainingTime = await increaseRemainingTime(roomId, -1)
    // if ((remainingTime < -1 && positions.length === 1) || remainingTime < -10) {
    //   clearInterval(timerInterval)
    //   redisHelperRoom.deleteRoom(roomId)
    // }
    // logger.info('roomId: '+ roomId + ' remainingTime: ' + remainingTime)
    if (remainingTime === 0) {
      await getInitialProperties()
      // if (positions.length === 1) clearInterval(timerInterval)
      if (lights[currentPlayer - 1] === 1 && positions.length > 1) {
        await kickUser(findUserId())
      } else if (positions.length > 1) {
        await changeTurn(roomId)
      }
    }
  }, 1000)
}

const findUserId = () => {
  const userObj = _.find(positions, function (o) {
    return o.player === currentPlayer
  })
  return userObj.userId
}

const getInitialProperties = async () => {
  const roomInfo = await redisHelperRoom.getAllProps()
  // marblesPosition = JSON.parse(roomInfo['marblesPosition'])
  positions = JSON.parse(roomInfo['positions'])
  currentPlayer = parseInt(roomInfo['currentPlayer'])
  lights = JSON.parse(roomInfo['lights'])
}

module.exports = init