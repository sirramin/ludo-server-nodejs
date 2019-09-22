const redisClient = require('../../common/redis-client')
const {redis: {prefixes: {users}}} = require('../../common/config')

const redisHelper = {

  async addGuestToRedis(username, userId) {
    await redisClient.hset(users + userId, 'username', username)
  },

  async addOnlineStatus(userId, status) {
    if (status)
      await redisClient.sadd('online', userId)
    else
      await redisClient.srem('online', userId)
  },

  async addSocketIdToRedis(userId, socketId) {
    await redisClient.hset(users + userId, 'socketId', socketId)
  },

  async removeUserSocketIdFromRedis(userId) {
    await redisClient.hdel(users + userId, 'socketId')
  },

  async addDisconnectStatusToUser(userId) {
    await redisClient.hset(users + userId, 'dc', true)
  },

  async changeSocketId(userId, socketId) {
    await redisClient.hset(users + userId, 'socketId', socketId)
  },

  async findUserCurrentRoom(userId) {
    return await redisClient.hget(users + userId, 'roomId')
  },

  async updateUserRoom(roomId, userId) {
    return await redisClient.hset(users + userId, 'room', roomId)
  },

  async deleteUserRoom(userId) {
    return await redisClient.hdel(users + userId, 'room')
  },

  async LoopRemovePlayersRoomInRedis(roomPlayersArray, roomId) {
    for (let i = 0; i < roomPlayersArray.length; i++) {
      redisHelper.deleteUserRoom(roomPlayersArray[i])
      // await updateUserRoom('', roomPlayersArray[i])
    }
  },

  async getUsername(userId) {
    return await redisClient.hget(users + userId, 'username')
  },

  async getSocketId(userId) {
    return await redisClient.hget(users + userId, 'socketId')
  },

}

module.exports = redisHelper
