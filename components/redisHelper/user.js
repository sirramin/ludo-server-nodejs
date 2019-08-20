const redisClient = require('../../common/redis-client')
const {redis: redisConfig} = require('../../common/config')

const redisHelper = {

  async addGuestToRedis(username, userId) {
    await redisClient.hset(redisConfig.prefixes.users + userId, 'username', username)
  },

  async addOnlineStatus(userId, status) {
    if (status)
      await redisClient.sadd('online', userId)
    else
      await redisClient.srem('online', userId)
  },

  async addSocketIdToRedis(userId, socketId) {
    await redisClient.hset(redisConfig.prefixes.users + userId, 'socketId', socketId)
  },

  async removeUserSocketIdFromRedis(userId) {
    await redisClient.hdel(redisConfig.prefixes.users + userId, 'socketId')
  },

  async addDisconnectStatusToUser(userId) {
    await redisClient.hset(redisConfig.prefixes.users + userId, 'dc', true)
  },

  async changeSocketId(userId, socketId) {
    await redisClient.hset(redisConfig.prefixes.users + userId, 'socketId', socketId)
  },

  async findUserCurrentRoom(userId) {
    return await redisClient.hget(redisConfig.prefixes.users + userId, 'roomId')
  },
  async updateUserRoom(roomId, userId) {
    return await redisClient.hset(redisConfig.prefixes.users + userId, 'room', roomId)
  },
  async deleteUserRoom(userId) {
    return await redisClient.hdel(redisConfig.prefixes.users + userId, 'room')
  }

}

module.exports = redisHelper
