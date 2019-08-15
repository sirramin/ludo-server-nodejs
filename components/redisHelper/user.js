const redisClient = require('../../common/redis-client')
const userRoomPrefix = 'user_room:'
const usersPrefix = 'users:'

const _getUserInfoFromRedis = async (userInfo) => {
  const userData = await redisClient.hget(marketKey, userInfo.userId)
  return JSON.parse(userData)
}

const _getUserRoomFromRedis = async (userInfo) => {
  return await redisClient.hget(userRoomPrefix, userInfo.userId)
}

const redisHelper = {

    async addUserToRedis (name, userId)  {
    const userInfo = {
      "username": name,
      "userId": userId,
    }
    await redisClient.hmset(usersPrefix, userId, JSON.stringify(userInfo))
  },

  async addOnlineStatus (userInfo, status)  {
    if (status)
      await redisClient.sadd('online', userInfo.userId)
    else
      await redisClient.srem('online', userInfo.userId)
  },

  async checkIsConnectedBefore (userInfo)  {
    const userDataParsed = await _getUserInfoFromRedis(userInfo)
    const userRoom = await _getUserRoomFromRedis(userInfo, gameMeta)
    if (userDataParsed && userDataParsed.hasOwnProperty('dc') || userRoom)
      return userDataParsed.socketId
    else return false
  },

  async addSocketIdToRedis (userInfo, socketId)  {
    let userDataParsed = await getUserInfoFromRedis(userInfo)
    userDataParsed.socketId = socketId
    await redisClient.hset(marketKey, userInfo.userId, JSON.stringify(userDataParsed))
  },

}

module.exports = redisHelper
