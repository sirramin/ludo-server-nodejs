const redisClient = require('../../common/redis-client')
const uniqid = require('uniqid')
const methods = require('../redisHelper/room')
const logicStart = require('../logics/gameStart')
const {gameMeta, redis: redisConfig} = require('../../common/config')
let socketObject = null
const userId = socket.userInfo.userId

const asyncLoop = async (i, leagueId) => {
  i = i || gameMeta.roomMax - 1
  for (i; i >= 1; i--) {
    const args = [redisConfig.prefixes.roomsList, i, i]
    const availableRooms = await redisClient.zrangebyscore(args)
    if (availableRooms.length) {
      return await asyncForeach(availableRooms, i, leagueId)
    }
  }
  return false
}

const asyncForeach = async (availableRooms, i, leagueId) => {
  for (let j = 1; j <= availableRooms.length; j++) {
    const roomCurrentInfo = await redisClient.hget(redisConfig.prefixes.rooms + availableRooms[j - 1], 'info')
    const roomCurrentInfoParsed = JSON.parse(roomCurrentInfo)
    if (roomCurrentInfoParsed && roomCurrentInfoParsed.state === 'waiting' && roomCurrentInfoParsed.leagueId === leagueId) {
      return roomCurrentInfoParsed.roomId
    }
  }
  if (i > 1)
    return await asyncLoop(i - 1, leagueId)
  return false
}

const joinPlayerToRoom = async (roomId, socket) => {
  const roomCurrentData = await redisClient.hmget(redisConfig.prefixes.rooms + roomId, 'info', 'players')
  let currentPlayers = JSON.parse(roomCurrentData[1])
  let roomInfo = JSON.parse(roomCurrentData[0])
  const currentPlayersLength = currentPlayers.length
  let newState
  if (currentPlayersLength === gameMeta.roomMax)
    socket.emit('matchEvent', {
      code: 2,
      event: 'roomIsFull'
    })
  currentPlayersLength === gameMeta.roomMax - 1 ? newState = "started" : newState = "waiting"
  roomInfo.state = newState
  currentPlayers.push(userId)
  await redisClient.hmset(redisConfig.prefixes.rooms + roomId, 'info', JSON.stringify(roomInfo), 'players', JSON.stringify(currentPlayers))
  await redisClient.zincrby(redisConfig.prefixes.roomsList, 1, roomId)
  await updateUserRoom(roomId)
  io.of('/').adapter.remoteJoin(socket.id, roomId, (err) => {
  })

  sendMatchEvents(roomId, 3, 'playerJoined', {
    roomId: roomId
  })
  if (newState === "started")
    gameStart(roomId, 'room fulled')
}


module.exports = {
  findAvailableRooms,
  kickUserFromRoomByDC,
  findUserCurrentRoom,
  changeSocketIdAndSocketRoom,
  leftRoom
}