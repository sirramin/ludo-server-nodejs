const redisClient = require('../../common/redis-client')
const {redis: {prefixes: {rooms}}} = require('../../common/config')
const exp = {}

////////////////////////    set    /////////////////////////////////////////////
exp.updateRemainingTime = async (roomId, time) => {
  await redisClient.hset(rooms + roomId, 'remainingTime', time)
}

exp.increaseRemainingTime = async (roomId, time) => {
  return await redisClient.hincrby(rooms + roomId, 'remainingTime', time)
}

exp.updateDiceAttempts = async (roomId, attempt) => {
  await redisClient.hset(rooms + roomId, 'diceAttempts', attempt)
}

exp.increaseDiceAttempts = async (roomId) => {
  return await redisClient.hincrby(rooms + roomId, 'diceAttempts', 1)
}

exp.updateCurrentPlayer = async (roomId, currentPlayer) => {
  await redisClient.hset(rooms + roomId, 'currentPlayer', currentPlayer)
}

exp.updateDiceNumber = async (roomId, diceNumber) => {
  await redisClient.hset(rooms + roomId, 'diceNumber', diceNumber)
}

exp.initLights = async (roomId, lights) => {
  await redisClient.hset(rooms + roomId, 'lights', JSON.stringify(lights))
}

exp.decreaseLights = async (roomId, playerNumber) => {
  let lights = await exp.getLights(roomId)
  lights[playerNumber - 1] -= 1
  await redisClient.hset(rooms + roomId, 'lights', JSON.stringify(lights))
}

exp.updateMarblesPosition = async (roomId, marblesPosition) => {
  await redisClient.hset(rooms + roomId, 'marblesPosition', JSON.stringify(marblesPosition))
}

exp.updatePositions = async (roomId, positions) => {
  await redisClient.hset(rooms + roomId, 'positions', JSON.stringify(positions))
}

////////////////////////    get    /////////////////////////////////////////////
exp.getCurrentPlayer = async (roomId) => {
  const currentPlayer = await redisClient.hget(rooms + roomId, 'currentPlayer')
  return parseInt(currentPlayer)
}

exp.getLights = async (roomId) => {
  const lights = await redisClient.hget(rooms + roomId, 'lights')
  return JSON.parse(lights)
}

exp.getPositions = async (roomId) => {
  const positions = await redisClient.hget(rooms + roomId, 'positions')
  return JSON.parse(positions)
}

exp.getMarblesPosition = async (roomId) => {
  const marblesPosition = await redisClient.hget(rooms + roomId, 'marblesPosition')
  return JSON.parse(marblesPosition)
}

exp.getDiceAttempts = async (roomId) => {
  const diceAttempts = await redisClient.hget(rooms + roomId, 'diceAttempts')
  return parseInt(diceAttempts)
}

exp.getDiceNumber = async (roomId) => {
  const diceNumber = await redisClient.hget(rooms + roomId, 'diceNumber')
  return parseInt(diceNumber)
}

module.exports = exp