const redisClient = require('../../common/redis-client')
const {gameMeta, redis: redisConfig} = require('../../common/config')
const logicStart = require('../logics/gameStart')
const socketHelper = require('../realtime/socketHelper')
const redisHelperRoom = require('../redisHelper/room')

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
  redisHelperRoom.addPlayerTooRoom(roomId, socket.userId)
  await redisClient.zincrby(redisConfig.prefixes.roomsList, 1, roomId)
  await updateUserRoom(roomId, socket.userId)
  socketHelper.joinRoom(socket.id, roomId)
  socketHelper.sendMatchMakingEvents(roomId, 'بازیکن جدیدی عضو اتاق شد')
  if (currentPlayersLength === gameMeta.roomMax - 1) {
    redisHelperRoom.changeRoomState(roomId, 'started')
    gameStart(roomId)
  }
}

const checkRoomIsReady = async (roomId) {
  // TODO
  // if (currentPlayersLength === gameMeta.roomMax) {
  //   socket.emit('matchEvent', 'roomIsFull')
  // }
}

const updateUserRoom = async (roomId, userId) => {
  return await redisClient.hset(redisConfig.prefixes.users + userId, 'room', roomId)
}

const deleteUserRoom = async (userId) => {
  return await redisClient.hdel(redisConfig.prefixes.userRoom, userId)
}

const roomWaitingTimeOver = async (roomId) => {
  const roomCurrentInfo = await redisClient.hmget(redisConfig.prefixes.rooms + roomId, 'info', 'players')
  if (roomCurrentInfo) {
    const currentPlayers = JSON.parse(roomCurrentInfo[1]).length
    const roomState = JSON.parse(roomCurrentInfo[0]).state
    if (currentPlayers >= gameMeta.roomMin && roomState !== 'started')
      gameStart(roomId, 'time over')
    else if (roomState !== 'started')
      destroyRoom(roomId)
  }
}

const gameStart = async (roomId) => {
  io.of('/').adapter.allRooms((err, rooms) => {
    logger.info('all socket io rooms: ' + rooms) // an array containing all rooms (across every node)
  })
  sendMatchEvents(roomId, 4, 'gameStarted', {
    roomId: roomId
  })
  const roomHash = await redisClient.hmget(redisConfig.prefixes.rooms + roomId, 'info', 'players')
  const roomHashParsed = JSON.parse(roomHash[0])
  roomHashParsed.state = 'started'
  await redisClient.hset(redisConfig.prefixes.rooms + roomId, 'info', JSON.stringify(roomHashParsed))
  await logicStart(roomId)
}

const makeRemainingPlayerWinner = async (roomId) => {
  const players = await getProp('players')
  const positions = await getProp('positions')
  const info = await getProp('info')
  // if(positions && positions.length) {
  const winnerPlayerNumber = positions[0].player
  const winnerId = players[0]
  await setProp('winner', winnerId)
  sendGameEvents(24, 'gameEnd', {
    "winner": winnerPlayerNumber
  })
  await deleteUserRoom(winnerId)
  await addToLeaderboard(winnerId, true)
  await givePrize(winnerId, info.leagueId)
  const winnerSocketId = await getUserSocketIdFromRedis(winnerId)
  io.of('/').adapter.remoteDisconnect(winnerSocketId, true, (err) => {
    logger.info('---------- remoteDisconnect winner-------------------')
  })
  await deleteRoom(roomId)
  // const roomInfo = await getProp('info')
  // roomInfo.state = 'finished'
  // await setProp('info', JSON.stringify(roomInfo))
  // }
}

module.exports = {
  loopOverAllRooms,
  loopOverAvailableRooms,
  joinPlayerToRoom,
  roomWaitingTimeOver,
  makeRemainingPlayerWinner
}