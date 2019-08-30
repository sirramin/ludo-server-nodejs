const redisClient = require('../../common/redis-client')
const {redis: redisConfig} = require('../../common/config')

const getRoomPlayers = async (roomId) => {
  return await redisClient.smembers(redisConfig.prefixes.roomPlayers + roomId)
}

module.exports = {
  getRoomPlayers
}