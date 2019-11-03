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

exp.getCurrentPlayer = async (roomId, currentPlayer) => {
  await redisClient.hget(rooms + roomId, 'currentPlayer', currentPlayer)
}

exp.updateCurrentPlayer = async (roomId, currentPlayer) => {
  await redisClient.hset(rooms + roomId, 'currentPlayer', currentPlayer)
}

module.exports = exp