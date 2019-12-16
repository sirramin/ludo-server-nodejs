const redisClient = require('../../common/redis-client')
const {gameMeta, redis: {prefixes: {rooms, roomsList}}} = require('../../common/config')

const exp = {}

exp.updateRoomsListCount = async (roomId, count) => {
  await redisClient.zincrby(roomsList, count, roomId)
}


module.exports = exp