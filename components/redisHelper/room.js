const redisClient = require('../../common/redis-client')
const uuidv4 = require('uuid/v4');
const socketHelper = require("../realtime/socketHelper")
const {gameMeta, redis: redisConfig} = require('../../common/config')
const redisHelperUser = require('./user')
const startHelper = require('./start')
const {addPlayerTooRoom, numberOfPlayersInRoom, removeAlPlayerFromRoom} = require('./players')

const exp = {}

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

exp.createNewRoom = async () => {
  const roomId = uuidv4()
  const currentTimeStamp = new Date().getTime()
  const hmArgs = [redisConfig.prefixes.rooms + roomId,
    'state', "waiting",
    'creationDateTime', currentTimeStamp,
  ]
  await redisClient.hmset(hmArgs)
  setTimeout(() => {
    _roomWaitingTimeOver(roomId)
  }, gameMeta.waitingTime)
  return roomId
}

const _changeRoomState = async (roomId, state) => {
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, 'state', state)
}

exp.checkRoomIsFull = async (roomId) => {
  const numberOfRoomPlayers = await numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers === gameMeta.roomMax
}

exp.checkRoomIsReady = async (roomId) => {
  const numberOfRoomPlayers = await numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers === gameMeta.roomMax - 1
}

exp.loopOverAllRooms = async (i) => {
  i = i || gameMeta.roomMax - 1
  for (i; i >= 1; i--) {
    const args = [redisConfig.prefixes.roomsList, i, i]
    const availableRooms = await redisClient.zrangebyscore(args)
    if (availableRooms.length) {
      return await _loopOverAvailableRooms(availableRooms, i)
    }
  }
  return false
}

exp.joinPlayerToRoom = async (roomId, socket) => {
  if (await exp.checkRoomIsFull(roomId)) {
    socket.binary(true).emit('errorMessage', stringBuf('room is full'))
    return
  }
  if (await _checkRoomStarted(roomId)) {
    socket.binary(true).emit('errorMessage', stringBuf('this room game started before'))
    return
  }
  await addPlayerTooRoom(roomId, socket.userId)
  await redisClient.zincrby(redisConfig.prefixes.roomsList, 1, roomId)
  await redisHelperUser.updateUserRoom(roomId, socket.userId)
  socketHelper.joinRoom(socket.id, roomId)
  if (await exp.checkRoomIsReady(roomId)) {
    _changeRoomState(roomId)
    startHelper(roomId)
  }
}

const _loopOverAvailableRooms = async (availableRooms, i) => {
  for (const roomId of availableRooms) {
    const roomCurrentInfo = await redisClient.hmget(redisConfig.prefixes.rooms + roomId, 'state')
    if (roomCurrentInfo && roomCurrentInfo.length && roomCurrentInfo[0] === 'waiting') {
      return roomId
    }
  }
  if (i > 1)
    return await exp.loopOverAllRooms(i - 1)
  return false
}

const _checkRoomStarted = async (roomId) => {
  const state = await redisClient.hget(redisConfig.prefixes.rooms + roomId, 'state')
  return state === 'started'
}

const _checkRoomHasMinimumPlayers = async (roomId) => {
  const numberOfRoomPlayers = await numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers >= gameMeta.roomMin
}

const _roomWaitingTimeOver = async (roomId) => {
  if (! await _checkRoomStarted(roomId)) {
    if (await _checkRoomHasMinimumPlayers(roomId)) {
      _changeRoomState(roomId)
      startHelper(roomId)
    } else {
      await _destroyRoom(roomId)
    }
  }
}

const _destroyRoom = async (roomId) => {
  await removeAlPlayerFromRoom(roomId)
  await redisClient.del(redisConfig.prefixes.rooms + roomId)
  await redisClient.zrem(redisConfig.prefixes.roomsList, roomId)
  socketHelper.sendString(roomId, 'اتاق بسته شد')
  io.of('/').in(roomId).clients((error, clients) => {
    if (error) logger.error(error)
    if (clients.length) {
      clients.forEach(client => io.of('/').adapter.remoteLeave(client, roomId))
    }
  })
  logger.info(roomId + ' destroyed')
}

module.exports = exp