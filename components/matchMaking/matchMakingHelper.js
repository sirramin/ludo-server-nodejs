const redisClient = require('../../common/redis-client')
const {gameMeta, redis: redisConfig} = require('../../common/config')
const logicStart = require('../logics/gameStart')
const socketHelper = require('../realtime/socketHelper')
const redisHelperRoom = require('../redisHelper/room')
const redisHelperUser = require("../redisHelper/user")

const loopOverAllRooms = async (i, leagueId) => {
  i = i || gameMeta.roomMax - 1
  for (i; i >= 1; i--) {
    const args = [redisConfig.prefixes.roomsList, i, i]
    const availableRooms = await redisClient.zrangebyscore(args)
    if (availableRooms.length) {
      return await loopOverAvailableRooms(availableRooms, i, leagueId)
    }
  }
  return false
}

const loopOverAvailableRooms = async (availableRooms, i, leagueId) => {
  for (let j = 1; j <= availableRooms.length; j++) {
    const roomCurrentInfo = await redisClient.hget(redisConfig.prefixes.rooms + availableRooms[j - 1], 'info')
    const roomCurrentInfoParsed = JSON.parse(roomCurrentInfo)
    if (roomCurrentInfoParsed && roomCurrentInfoParsed.state === 'waiting' && roomCurrentInfoParsed.leagueId === leagueId) {
      return roomCurrentInfoParsed.roomId
    }
  }
  if (i > 1)
    return await loopOverAllRooms(i - 1, leagueId)
  return false
}

const joinPlayerToRoom = async (roomId, socket) => {
  if (redisHelperRoom.checkRoomIsFull) {
    socket.emit('matchEvent', 'roomIsFull')
    return
  }
  if (redisHelperRoom.checkRoomStarted) {
    socket.emit('matchEvent', 'roomStartedBefore')
    return
  }
  await redisHelperRoom.addPlayerTooRoom(roomId, socket.userId)
  await redisClient.zincrby(redisConfig.prefixes.roomsList, 1, roomId)
  await redisHelperUser.updateUserRoom(roomId, socket.userId)
  socketHelper.joinRoom(socket.id, roomId)
  socketHelper.sendMatchMakingEvents(roomId, 'بازیکن جدیدی عضو اتاق شد')
  if (redisHelperRoom.checkRoomIsReady) {
    gameStart(roomId)
  }
}

const roomWaitingTimeOver = (roomId) => {
  if (!redisHelperRoom.checkRoomStarted(roomId)) {
    if (redisHelperRoom.checkRoomHasMinimumPlayers(roomId)) {
      gameStart(roomId, 'time over')
    } else {
     redisHelperRoom.destroyRoom(roomId)
    }
  }
}

const gameStart = async (roomId) => {
  redisHelperRoom.changeRoomState(roomId, 'started')
  await logicStart(roomId)
}

module.exports = {
  loopOverAllRooms,
  loopOverAvailableRooms,
  joinPlayerToRoom,
  roomWaitingTimeOver
}