const redisClient = require('../../common/redis-client')
const {redis: redisConfig} = require('../../common/config')
const exp = {}

exp.updateRemainingTime = async (roomId, time) => {
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, 'remainingTime', time)
}

exp.updateDiceAttempts = async (roomId, attempt) => {
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, 'diceAttempts', attempt)
}

exp.updateCurrentPlayer = async (roomId, currentPlayer) => {
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, 'currentPlayer', currentPlayer)
}

module.exports = exp