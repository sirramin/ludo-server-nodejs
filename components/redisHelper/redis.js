const redisClient = require('../../common/redis-client')
const userRoomPrefix = 'user_room:'
const usersPrefix = 'users:'

const exportObject = {}

const addUserToRedis = async (name, userId) => {
  const userInfo = {
    "username": name,
    "userId": userId,
  }
  await redisClient.hmset(usersPath, userId, JSON.stringify(userInfo))
}

exportObject.addOnlineStatus = async (userInfo, status) => {
  if (status)
    await redisClient.sadd('online', userInfo.userId)
  else
    await redisClient.srem('online', userInfo.userId)
}

exportObjec.checkIsConnectedBefore = async (userInfo) => {
  const userDataParsed = await getUserInfoFromRedis(userInfo)
  const userRoom = await getUserRoomFromRedis(userInfo, gameMeta)
  if (userDataParsed && userDataParsed.hasOwnProperty('dc') || userRoom)
    return userDataParsed.socketId
  else return false
}

exportObject.addSocketIdToRedis = async (userInfo, socketId) => {
  let userDataParsed = await getUserInfoFromRedis(userInfo)
  userDataParsed.socketId = socketId
  await redisClient.hset(marketKey, userInfo.userId, JSON.stringify(userDataParsed))
}

exportObject.getUserInfoFromRedis = async (userInfo) => {
  const userData = await redisClient.hget(marketKey, userInfo.userId)
  return JSON.parse(userData)
}

exportObject.getUserRoomFromRedis = async (userInfo) => {
  return await redisClient.hget(userRoomPrefix, userInfo.userId)
}

module.exports = exportObject
