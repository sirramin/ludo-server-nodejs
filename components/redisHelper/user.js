const redisClient = require('../../common/redis-client')
const {gameMeta, redis: redisConfig} = require('../../common/config')


const _getUserInfoFromRedis = async (userInfo) => {
  const userData = await redisClient.hget(marketKey, userInfo.userId)
  return JSON.parse(userData)
}

const _getUserRoomFromRedis = async (userInfo) => {
  return await redisClient.hget(userRoomPrefix, userInfo.userId)
}

const redisHelper = {

  async addGuestToRedis(username, userId) {
    await redisClient.hset(redisConfig.prefixes.users + userId, 'username', username)
  },

  async addOnlineStatus(userInfo, status) {
    if (status)
      await redisClient.sadd('online', userInfo.userId)
    else
      await redisClient.srem('online', userInfo.userId)
  },

  async checkIsConnectedBefore(userInfo) {
    const userDataParsed = await _getUserInfoFromRedis(userInfo)
    const userRoom = await _getUserRoomFromRedis(userInfo, gameMeta)
    if (userDataParsed && userDataParsed.hasOwnProperty('dc') || userRoom)
      return userDataParsed.socketId
    else return false
  },

  async addSocketIdToRedis(userInfo, socketId) {
    let userDataParsed = await getUserInfoFromRedis(userInfo)
    userDataParsed.socketId = socketId
    await redisClient.hset(marketKey, userInfo.userId, JSON.stringify(userDataParsed))
  },

  async removeUserSocketIdFromRedis(userId) {
    const userDataParsed = await redisHelper.getUserData(userId)
    if (userDataParsed)
      delete userDataParsed['socketId']
    await setUserData(userDataParsed)
  },

  async getUserData(userId) {
    const userData = await redisClient.hget(redisConfig.prefixes.users, userId)
    return JSON.parse(userData)
  },

  async setUserData(userDataParsed) {
    await redisClient.hset(redisConfig.prefixes.users, userId, JSON.stringify(userDataParsed))
  },

  async addDisconnectStatusToUser() {
    const userDataParsed = await getUserData()
    if (userDataParsed)
      userDataParsed['dc'] = true
    await setUserData(userDataParsed)
  }

}

module.exports = redisHelper
