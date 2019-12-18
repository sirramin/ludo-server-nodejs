const redisClient = require('../../common/redis-client')
const {redis: {prefixes: {roomsList}}} = require('../../common/config')

const exp = {}

exp.updateRoomsListCount = async (roomId, count) => {
  await redisClient.zincrby(roomsList, count, roomId)
}


module.exports = exp