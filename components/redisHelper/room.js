const redisClient = require('../../common/redis-client')
const {roomWaitingTimeOver, joinPlayerToRoom} = require("../matchMaking/matchMakingHelper")
const {gameMeta, redis: redisConfig} = require('../../common/config')
const exp = {}

exp.setProp = async (field, value) => {
  await redisClient.hset(redisConfig.prefixes.rooms, field, value)
}

exp.setMultipleProps = async (...args) => {
  await redisClient.hmset(redisConfig.prefixes.rooms, ...args)
}

exp.getProp = async (field) => {
  const value = await redisClient.hget(redisConfig.prefixes.rooms, field)
  return JSON.parse(value)
}

exp.incrProp = async (field, number) => {
  return await redisClient.hincrby(redisConfig.prefixes.rooms, field, number)
}

exp.getAllProps = async () => {
  return await redisClient.hgetall(redisConfig.prefixes.rooms)
}

exp.deleteRoom = async (roomId) => {
  await redisClient.del(redisConfig.prefixes.rooms)
  await redisClient.zrem(redisConfig.prefixes.roomsList, roomId)
}

exp.kickUser = async (userId) => {
  const currentPlayers = await getProp('players')
  const socketId = await getUserSocketIdFromRedis(userId)
  if (currentPlayers.length > 1) {
    await deleteUserRoom(userId)
    currentPlayers.splice(currentPlayers.indexOf(userId), 1)
    await redisClient.hset(redisConfig.prefixes.rooms, 'players', JSON.stringify(currentPlayers))
    await redisClient.zincrby(redisConfig.prefixes.roomsList, -1, roomId)
    await sendEventToSpecificSocket(userId, 203, 'youWillBeKicked', 1)
    io.of('/').adapter.remoteDisconnect(socketId, true, async (err) => {
      const gameLeft = require('../logics/' + gameMeta.name + '/gameLeft')(userId, roomId)
      await gameLeft.handleLeft()
      logger.info('---------- remoteDisconnect kick-------------------')
      await addToLeaderboard(userId, false)
      if (currentPlayers && currentPlayers.length === 1) {
        await makeRemainingPlayerWinner(roomId)
      }
    })
  }
}

exp.getUserSocketIdFromRedis = async (userId) => {
  const userDataParsed = JSON.parse(await redisClient.hget(redisConfig.prefixes.users, userId))
  return userDataParsed.socketId
}

exp.deleteUserRoom = async (userId) => {
  return await redisClient.hdel(redisConfig.prefixes.userRoom, userId)
}

exp.getUserData = async (userId) => {
  return JSON.parse(await redisClient.hget(redisConfig.prefixes.users, userId))
}

exp.getRoomPlayersWithNames = async (roomId) => {
  const roomPlayers = await getRoomPlayers(roomId)
  let roomPlayersWithNames = []
  for (let i = 0; i < roomPlayers.length; i++) {
    const playerNumber = (i + 1)
    const userData = await redisClient.hget(redisConfig.prefixes.rooms, roomPlayers[i])
    roomPlayersWithNames.push({player: playerNumber, userId: roomPlayers[i], name: JSON.parse(userData).name})
  }
  return roomPlayersWithNames
}

exp.destroyRoom = async (roomId) => {
  const roomplayers = await redisClient.hget(redisConfig.prefixes.rooms + roomId, 'players')
  const roomPlayersArray = JSON.parse(roomplayers)
  await asyncLoopRemovePlayersRoomInRedis(roomPlayersArray, roomId)

  await redisClient.del(redisConfig.prefixes.rooms + roomId)
  await redisClient.zrem(redisConfig.prefixes.roomsList, roomId)
  sendMatchEvents(roomId, 5, 'roomDestroyed', {
    roomId: roomId
  })
  io.of('/').in(roomId).clients((error, clients) => {
    if (error) logger.error(error)
    if (clients.length) {
      clients.forEach(client => io.of('/').adapter.remoteLeave(client, roomId));
    }
  })
  logger.info(roomId + ' destroyed')
}

exp.asyncLoopRemovePlayersRoomInRedis = async (roomPlayersArray, roomId) => {
  for (let i = 0; i < roomPlayersArray.length; i++) {
    await deleteUserRoom(roomPlayersArray[i])
    // await updateUserRoom('', roomPlayersArray[i])
  }
}

exp.createNewRoom = async (leagueId, socket) => {
  const roomId = uniqid()
  const currentTimeStamp = new Date().getTime()
  const hmArgs = [redisConfig.prefixes.rooms + roomId,
    'state', "waiting",
    'creationDateTime', currentTimeStamp,
    'leagueId', leagueId
  ]
  await redisClient.hmset(hmArgs)
  joinPlayerToRoom(roomId, socket)
  setTimeout(async () => {
    await roomWaitingTimeOver(roomId)
  }, gameMeta.waitingTime)
}

exp.addPlayerTooRoom = async (roomId, userId) => {
  await redisClient.sadd(redisConfig.prefixes.roomPlayers + roomId, userId)
}

exp.numberOfPlayersInRoom = async (roomId) => {
  return await redisClient.scard(redisConfig.prefixes.roomPlayers + roomId)
}

exp.removePlayerFromRoom = async (roomId, userId) => {
  await redisClient.sadd(redisConfig.prefixes.roomPlayers + roomId, userId)
}

exp.changeRoomState = async (roomId, state) => {
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, 'state', state)
}

exp.checkRoomStarted = async (roomId) => {
  const state = await redisClient.hget(redisConfig.prefixes.rooms + roomId, 'state')
  return state === 'started'
}

exp.checkRoomIsFull = async (roomId) => {
  const numberOfRoomPlayers = await exp.numberOfPlayersInRoom(roomId)
   return numberOfRoomPlayers === gameMeta.roomMax
}

exp.checkRoomIsReady = async (roomId) => {
  const numberOfRoomPlayers = await exp.numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers === gameMeta.roomMax - 1
}

exp.checkRoomHasMinimumPlayers = async (roomId) => {
  const numberOfRoomPlayers = await exp.numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers >= gameMeta.roomMin
}

module.exports = exp