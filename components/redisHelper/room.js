const redisClient = require('../../common/redis-client')
const uuidv4 = require('uuid/v4');
const socketHelper = require("../realtime/socketHelper")
const {gameMeta, redis: redisConfig} = require('../../common/config')
const logicStart = require('../logics/gameStart')
const redisHelperUser = require('./user')
const exp = {}

exp.setProp = async (roomId, field, value) => {
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, field, value)
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

exp.asyncLoopRemovePlayersRoomInRedis = async (roomPlayersArray, roomId) => {
  for (let i = 0; i < roomPlayersArray.length; i++) {
    await deleteUserRoom(roomPlayersArray[i])
    // await updateUserRoom('', roomPlayersArray[i])
  }
}

exp.createNewRoom = async (leagueId) => {
  const roomId = uuidv4()
  const currentTimeStamp = new Date().getTime()
  const hmArgs = [redisConfig.prefixes.rooms + roomId,
    'state', "waiting",
    'creationDateTime', currentTimeStamp,
    'leagueId', leagueId
  ]
  await redisClient.hmset(hmArgs)
  setTimeout(() => {
    _roomWaitingTimeOver(roomId)
  }, gameMeta.waitingTime)
  return roomId
}

_checkRoomStarted = async (roomId) => {
  const state = await redisClient.hget(redisConfig.prefixes.rooms + roomId, 'state')
  return state === 'started'
}

exp.checkRoomHasMinimumPlayers = async (roomId) => {
  const numberOfRoomPlayers = await exp.numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers >= gameMeta.roomMin
}

_roomWaitingTimeOver = (roomId) => {
  if (!_checkRoomStarted(roomId)) {
    if (exp.checkRoomHasMinimumPlayers(roomId)) {
      exp.start(roomId)
    } else {
      _destroyRoom(roomId)
    }
  }
}

const _destroyRoom = async (roomId) => {
  await redisClient.del(redisConfig.prefixes.roomPlayers + roomId)
  await redisClient.del(redisConfig.prefixes.rooms + roomId)
  await redisClient.zrem(redisConfig.prefixes.roomsList, roomId)
  socketHelper.sendString(roomId, 'اتاق بسته شد')
  io.of('/').in(roomId).clients((error, clients) => {
    if (error) logger.error(error)
    if (clients.length) {
      clients.forEach(client => io.of('/').adapter.remoteLeave(client, roomId));
    }
  })
  logger.info(roomId + ' destroyed')
}

exp.addPlayerTooRoom = async (roomId, userId) => {
  await redisClient.sadd(redisConfig.prefixes.roomPlayers + roomId, userId)
}

exp.numberOfPlayersInRoom = async (roomId) => {
  return await redisClient.scard(redisConfig.prefixes.roomPlayers + roomId)
}

exp.getRoomPlayers = async (roomId) => {
  return await redisClient.smembers(redisConfig.prefixes.roomPlayers + roomId)
}

exp.removePlayerFromRoom = async (roomId, userId) => {
  await redisClient.sadd(redisConfig.prefixes.roomPlayers + roomId, userId)
}

exp.changeRoomState = async (roomId, state) => {
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, 'state', state)
}

exp.checkRoomIsFull = async (roomId) => {
  const numberOfRoomPlayers = await exp.numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers === gameMeta.roomMax
}

exp.checkRoomIsReady = async (roomId) => {
  const numberOfRoomPlayers = await exp.numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers === gameMeta.roomMax - 1
}

exp.loopOverAllRooms = async (i, leagueId) => {
  i = i || gameMeta.roomMax - 1
  for (i; i >= 1; i--) {
    const args = [redisConfig.prefixes.roomsList, i, i]
    const availableRooms = await redisClient.zrangebyscore(args)
    if (availableRooms.length) {
      return await _loopOverAvailableRooms(availableRooms, i, leagueId)
    }
  }
  return false
}

_loopOverAvailableRooms = async (availableRooms, i, leagueId) => {
  for (const roomId of availableRooms) {
    const roomCurrentInfo = await redisClient.hmget(redisConfig.prefixes.rooms + roomId, 'state', 'leagueId')
    if (roomCurrentInfo && roomCurrentInfo.length && roomCurrentInfo[0] === 'waiting' && parseInt(roomCurrentInfo[1]) === leagueId) {
      return roomId
    }
  }
  if (i > 1)
    return await exp.loopOverAllRooms(i - 1, leagueId)
  return false
}

exp.joinPlayerToRoom = async (roomId, socket) => {
  if (await exp.checkRoomIsFull(roomId)) {
    socket.emit('string', 'roomIsFull')
    return
  }
  if (await _checkRoomStarted(roomId)) {
    socket.emit('string', 'roomStartedBefore')
    return
  }
  await exp.addPlayerTooRoom(roomId, socket.userId)
  await redisClient.zincrby(redisConfig.prefixes.roomsList, 1, roomId)
  await redisHelperUser.updateUserRoom(roomId, socket.userId)
  socketHelper.joinRoom(socket.id, roomId)
  socketHelper.sendString(roomId, 'بازیکن جدیدی عضو اتاق شد')
  if (await exp.checkRoomIsReady(roomId)) {
    exp.start(roomId)
  }
}

exp.start = async (roomId) => {
  exp.changeRoomState(roomId, 'started')
  logicStart(roomId)
}


module.exports = exp