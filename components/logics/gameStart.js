const _ = require('lodash')
const redisHelperRoom = require('../redisHelper/room')
const socketHelper = require("../realtime/socketHelper")

const maxTime = 11
let positions = []
let marblesPosition = {}
let orbs = {}
let currentPlayer
let hits = []
let beats = []

const init = async (roomId) => {
  const players = redisHelperRoom.getRoomPlayers(roomId)
  for (let i = 1; i <= players.length; i++) {
    orbs['player' + i] = 3
    hits[i - 1] = 0
    beats[i - 1] = 0
  }
  await sendPositions(sendPositions)
}

const sendPositions = async (roomId) => {
  const players = redisHelperRoom.getRoomPlayers(roomId)
  await redisHelperRoom.setProp('remainingTime', maxTime)
  await redisHelperRoom.setProp('diceAttempts', 0)
  players.forEach((item, index) => {
    const playerNumber = (index + 1)
    // positions.push({player: playerNumber, userId: item.userId, name: item.name})
    marblesPosition[playerNumber] = [0, 0, 0, 0]
    socketHelper.sendEventToSpecificSocket(item, 202, 'yourPlayerNumber', playerNumber)
  })
  positions = redisHelperRoom.getRoomPlayersWithNames(roomId)
  await redisHelperRoom.setMultipleProps(...['positions', JSON.stringify(positions), 'marblesPosition', JSON.stringify(marblesPosition), 'orbs', JSON.stringify(orbs), 'hits', JSON.stringify(hits), 'beats', JSON.stringify(beats)])
  redisHelperRoom.sendGameEvents(101, 'positions', positions)
  await firstTurn(roomId)
}

const firstTurn = async (roomId) => {
  const rand = Math.floor(Math.random() * numberOfplayers)
  const firstTurn = positions[rand].player
  currentPlayer = firstTurn
  await redisHelperRoom.setProp('currentPlayer', currentPlayer)
  //must be optimised
  const playerUserId = findUserId()
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
      if (orbs['player' + currentPlayer] === 1 && positions.length > 1)
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
  if (orbs['player' + nextPlayer] > 0) {
    currentPlayer = nextPlayer
    let propsArray = ['currentPlayer', currentPlayer]
    orbs['player' + previousPlayer] -= 1
    propsArray.push('orbs', JSON.stringify(orbs))
    await redisHelperRoom.setMultipleProps(...propsArray)
    redisHelperRoom.sendGameEvents(104, 'changeTurn', {
      "player": nextPlayer,
      "decreaseOrb": true,
      "timeEnds": true,
      "orbs": orbs
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
  orbs = JSON.parse(roomInfo['orbs'])
}

module.exports = init