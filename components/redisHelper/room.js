const redisClient = require('../../common/redis-client')
const uuidv4 = require('uuid/v4')
const socketHelper = require('../realtime/socketHelper')
const {gameMeta, redis: {prefixes: {rooms, roomsList}}} = require('../../common/config')
const startHelper = require('./start')
const {addPlayerTooRoom, numberOfPlayersInRoom, removeAlPlayerFromRoom} = require('./players')
const {stringBuf} = require('../../flatBuffers/str/data/str')

const exp = {}

exp.createNewRoom = async () => {
  const roomId = uuidv4()
  const currentTimeStamp = new Date().getTime()
  await redisClient.hset(rooms + roomId, "status", "waiting")
  redisClient.hset(rooms + roomId, "creationDateTime", currentTimeStamp)
  setTimeout(() => {
    _roomWaitingTimeOver(roomId)
  }, gameMeta.waitingTime)
  return roomId
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
    const args = [roomsList, i, i]
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
  socketHelper.joinRoom(socket.id, roomId)
  if (await exp.checkRoomIsReady(roomId)) {
    await _changeRoomState(roomId, 'started')
    await startHelper(roomId)
  }
}

exp.updateRoomsListCount = async (roomId, count) => {
  await redisClient.zincrby(roomsList, count, roomId)
}

exp.deleteRoom = async (roomId) => {
  await redisClient.del(rooms + roomId)
  await redisClient.zrem(roomsList, roomId)
}

const _changeRoomState = async (roomId, status) => {
  await redisClient.hset(rooms + roomId, "status", status)
}

const _loopOverAvailableRooms = async (availableRooms, i) => {
  for (const roomId of availableRooms) {
    const roomStatus = await redisClient.hget(rooms + roomId, 'status')
    if (roomStatus === 'waiting') {
      return roomId
    }
  }
  if (i > 1)
    return await exp.loopOverAllRooms(i - 1)
  return false
}

const _checkRoomStarted = async (roomId) => {
  const status = await redisClient.hget(rooms + roomId, 'status')
  return status === 'started'
}

const _checkRoomHasMinimumPlayers = async (roomId) => {
  const numberOfRoomPlayers = await numberOfPlayersInRoom(roomId)
  return numberOfRoomPlayers >= gameMeta.roomMin
}

const _roomWaitingTimeOver = async (roomId) => {
  if (!await _checkRoomStarted(roomId)) {
    if (await _checkRoomHasMinimumPlayers(roomId)) {
      await _changeRoomState(roomId, 'started')
      await startHelper(roomId)
    } else {
      await _destroyRoom(roomId)
    }
  }
}

module.exports = exp