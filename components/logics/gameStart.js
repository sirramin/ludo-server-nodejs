const _ = require('lodash')
const {getRoomPlayersCount, getRoomPlayers, getRoomPlayersWithNames} = require('../redisHelper/players')
const {updateRemainingTime, updateDiceAttempts, updateCurrentPlayer} = require('../redisHelper/logic')
const {emitToSpecificPlayer} = require('../realtime/socketHelper')
const {stringBuf} = require('../../flatBuffers/str/data/str')
const {integerBuf} = require('../../flatBuffers/int/data/int')

const maxTime = 11
let positions = []
let marblesPosition = {}
let lights = {}
let currentPlayer

const init = async (roomId) => {
  const playersCount = await getRoomPlayersCount(roomId)
  for (let i = 1; i <= playersCount; i++) {
    lights['player' + i] = 3
  }
  await sendPositions(roomId)
}

const sendPositions = async (roomId) => {
  const players = await getRoomPlayers(roomId)
  updateRemainingTime(roomId, maxTime)
  updateDiceAttempts(roomId, 0)
  for (const [index, userId]  of  players.entries()) {
    const playerNumber = index + 1
    marblesPosition[playerNumber] = [0, 0, 0, 0]
    emitToSpecificPlayer('yourPlayerNumber', userId, integerBuf(playerNumber))
  }
  positions = await getRoomPlayersWithNames(roomId)
  sendJson(roomId, {
    positions,
    marblesPosition,
    lights,
    hits,
    beats
  })
  await firstTurn(roomId)
}

const firstTurn = async (roomId) => {
  const playersCount = await getRoomPlayersCount(roomId)
  const rand = Math.floor(Math.random() * playersCount)
  const firstTurn = positions[rand].player
  currentPlayer = firstTurn
  await updateCurrentPlayer('currentPlayer', currentPlayer)
  //must be optimised
  const playerUserId = findUserId()
  sendJsonToSpecificPlayer(userId, {'yourTurn': 1})
  await redisHelperRoom.sendEventToSpecificSocket(playerUserId, 201, 'yourTurn', 1)
  // await redisHelperRoom.sendEventToSpecificSocket(playerUserId, 202, 'yourPlayerNumber', rand + 1)
  redisHelperRoom.sendGameEvents(102, 'firstTurn', firstTurn)
  timerCounter(roomId)
  redisHelperRoom.sendGameEvents(103, 'timerStarted')
}

const timerCounter = (roomId) => {
  const timerInterval = setInterval(async () => {
    const remainingTime = await redisHelperRoom.incrProp('remainingTime', -1)
    if ((remainingTime < -1 && positions.length === 1) || remainingTime < -10) {
      clearInterval(timerInterval)
      redisHelperRoom.deleteRoom(roomId)
    }
    // logger.info('roomId: '+ roomId + ' remainingTime: ' + remainingTime)
    if (remainingTime === 0) {
      await getInitialProperties()
      // if (positions.length === 1) clearInterval(timerInterval)
      if (lights['player' + currentPlayer] === 1 && positions.length > 1)
        await redisHelperRoom.kickUser(findUserId())
      else if (positions.length > 1) {
        await changeTurn()
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

const changeTurn = async () => {
  await redisHelperRoom.setProp('remainingTime', maxTime)
  await redisHelperRoom.setProp('diceAttempts', 0)
  currentPlayer = await redisHelperRoom.getProp('currentPlayer')
  const previousPlayer = currentPlayer
  const nextPlayer = previousPlayer + 1 > numberOfplayers ? 1 : previousPlayer + 1
  if (lights['player' + nextPlayer] > 0) {
    currentPlayer = nextPlayer
    let propsArray = ['currentPlayer', currentPlayer]
    lights['player' + previousPlayer] -= 1
    propsArray.push('lights', JSON.stringify(lights))
    await redisHelperRoom.setMultipleProps(...propsArray)
    redisHelperRoom.sendGameEvents(104, 'changeTurn', {
      "player": nextPlayer,
      "decreaseOrb": true,
      "timeEnds": true,
      "lights": lights
    })
    const playerUserId = findUserId()
    await redisHelperRoom.sendEventToSpecificSocket(playerUserId, 201, 'yourTurn', 1)
  }
}

const getInitialProperties = async () => {
  const roomInfo = await redisHelperRoom.getAllProps()
  // marblesPosition = JSON.parse(roomInfo['marblesPosition'])
  positions = JSON.parse(roomInfo['positions'])
  currentPlayer = parseInt(roomInfo['currentPlayer'])
  lights = JSON.parse(roomInfo['lights'])
}

module.exports = init