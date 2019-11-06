const redisClient = require('../../common/redis-client')
const {redis: {prefixes: {rooms, positions}}} = require('../../common/config')
const exp = {}

exp.updateRemainingTime = async (roomId, time) => {
  await redisClient.hset(rooms + roomId, 'remainingTime', time)
}

exp.increaseRemainingTime = async (roomId, time) => {
  return await redisClient.hincrby(rooms + roomId, 'remainingTime', time)
}

exp.updateDiceAttempts = async (roomId, attempt) => {
  await redisClient.hset(rooms + roomId, 'diceAttempts', attempt)
}

exp.updateCurrentPlayer = async (roomId, currentPlayer) => {
  await redisClient.hset(rooms + roomId, 'currentPlayer', currentPlayer)
}

exp.updateLights = async (roomId, lights) => {
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
  await redisClient.hget(rooms + roomId, 'currentPlayer')
}

exp.getLights = async (roomId) => {
  await redisClient.hget(rooms + roomId, 'lights')
  return JSON.parse(positions)
}

exp.getPositions = async (roomId) => {
  const positions = await redisClient.hget(rooms + roomId, 'positions')
  return JSON.parse(positions)
}

exp.getMarblesPositions = async (roomId) => {
  const marblesPosition = await redisClient.hget(rooms + roomId, 'marblesPosition')
  return JSON.parse(positions)
}

module.exports = exp