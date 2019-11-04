const redisClient = require('../../common/redis-client')
const {redis: {prefixes: {rooms}}} = require('../../common/config')
const exp = {}

exp.updateRemainingTime = async (roomId, time) => {
  await redisClient.hset(rooms + roomId, 'remainingTime', time)
}

exp.increaseRemainingTime = async (roomId, time) => {
  await redisClient.hincrby(rooms + roomId, 'remainingTime', time)
}

exp.updateDiceAttempts = async (roomId, attempt) => {
  await redisClient.hset(rooms + roomId, 'diceAttempts', attempt)
}

exp.updateCurrentPlayer = async (roomId, currentPlayer) => {
  await redisClient.hset(rooms + roomId, 'currentPlayer', currentPlayer)
}

exp.updateLights = async (roomId, lights) => {
  await redisClient.hset(rooms + roomId, 'lights', lights)
}

exp.updateMarblesPosition = async (roomId, marblesPosition) => {
  await redisClient.hset(rooms + roomId, 'marblesPosition', marblesPosition)
}


exp.getCurrentPlayer = async (roomId) => {
  await redisClient.hget(rooms + roomId, 'currentPlayer')
}

exp.getLights = async (roomId) => {
  await redisClient.hget(rooms + roomId, 'lights')
}

exp.getPositions = async (roomId) => {
  await redisClient.hget(rooms + roomId, 'positions')
}

module.exports = exp