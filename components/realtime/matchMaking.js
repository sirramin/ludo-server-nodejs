const redisClient = require('../../common/redis-client')
const uniqid = require('uniqid')
const methods = require('../redisHelper/room')
const logicStart = require('../logics/gameStart')
const {gameMeta, redis: redisConfig} = require('../../common/config')
let socketObject = null
const userId = socket.userInfo.userId

const findAvailableRooms = async (leagueId, socket) => {
  socketObject = socket
  leagueId = leagueId ? leagueId : 1
  try {
    const isPlayerJoinedBefore = await findUserCurrentRoom()
    if (isPlayerJoinedBefore) {
      socket.emit('matchEvent', {
        code: 1,
        event: 'playerAlreadyJoined'
      })
      return
    }
    const foundedRoom = await asyncLoop(null, leagueId)
    if (!foundedRoom)
      await createNewRoom(leagueId)
    else
      await joinPlayerToRoom(foundedRoom, leagueId, socket)
  } catch (e) {
    logger.error(e.message)
  }
}



const createNewRoom = async (leagueId) => {
  const roomId = uniqid()
  const currentTimeStamp = new Date().getTime()
  const newRoomInfo = {
    "roomId": roomId,
    "state": "waiting",
    "creationDateTime": currentTimeStamp,
    "leagueId": leagueId
  }
  const newRoomPlayers = [socket.userInfo.userId]
  const hmArgs = [redisConfig.prefixes.rooms + roomId, 'info', JSON.stringify(newRoomInfo), 'players', JSON.stringify(newRoomPlayers)]
  await redisClient.hmset(hmArgs)
  await redisClient.zadd(redisConfig.prefixes.roomsList, 1, roomId)
  await updateUserRoom(roomId)
  socket.join(roomId)
  sendMatchEvents(roomId, 3, 'playerJoined', {
    roomId: roomId
  })
  setTimeout(async () => {
    await roomWaitingTimeOver(roomId)
  }, gameMeta.waitingTime)
}

const updateUserRoom = async (roomId, anyUserId) => {
  const user_id = anyUserId ? anyUserId : userId
  return await redisClient.hset(userRoomPrefix, user_id, roomId)
}

const deleteUserRoom = async (userId) => {
  return await redisClient.hdel(userRoomPrefix, userId)
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

const destroyRoom = async (roomId) => {
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

const asyncLoopRemovePlayersRoomInRedis = async (roomPlayersArray, roomId) => {
  for (let i = 0; i < roomPlayersArray.length; i++) {
    await deleteUserRoom(roomPlayersArray[i])
    // await updateUserRoom('', roomPlayersArray[i])
  }
}

const kickUserFromRoomByDC = async () => {
  await removeUserSocketIdFromRedis()
  await addDisconnectStatusToUser()
  const userCurrentRoom = await findUserCurrentRoom()
  if (userCurrentRoom) {
    setTimeout(async () => {
      const userDataParsed = await getUserData()
      if (userDataParsed && userDataParsed.hasOwnProperty('dc') && userDataParsed.dc) {
        const roomData = await redisClient.hmget(redisConfig.prefixes.rooms + userCurrentRoom, 'players', 'info')
        if (roomData[0]) {
          const currentPlayersParsed = JSON.parse(roomData[0])
          const roomState = JSON.parse(roomData[1]).state
          if (currentPlayersParsed && currentPlayersParsed.length === 1 && roomState === 'waiting') {
            await destroyRoom(userCurrentRoom)
          } else if (currentPlayersParsed && currentPlayersParsed.length > 1) {
            await deleteUserRoom(userId)
            currentPlayersParsed.splice(currentPlayersParsed.indexOf(userId), 1)
            await redisClient.hset(redisConfig.prefixes.rooms + userCurrentRoom, 'players', JSON.stringify(currentPlayersParsed))
            await redisClient.zincrby(redisConfig.prefixes.roomsList, -1, userCurrentRoom)
            io.of('/').adapter.remoteDisconnect(socket.id, true, async (err) => {
              logger.info('---------- remoteDisconnect-------------------')
              const gameLeft = require('../logics/gameLeft')(io, userId, gameMeta, marketKey, userCurrentRoom)
              await gameLeft.handleLeft()
              const methods = require('../redisHelper/room')(io, gameMeta, userCurrentRoom, marketKey)
              await methods.addToLeaderboard(userId, false)
              if (currentPlayersParsed.length === 1) {
                await methods.makeRemainingPlayerWinner(userCurrentRoom)
              }
            })
          }
        }
      }
    }, gameMeta.kickTime)
  }
}

const leftRoom = async () => {
  await removeUserSocketIdFromRedis()
  await addDisconnectStatusToUser()
  const userCurrentRoom = await findUserCurrentRoom()
  if (userCurrentRoom) {
    const roomData = await redisClient.hmget(redisConfig.prefixes.rooms + userCurrentRoom, 'players', 'info')
    const currentPlayersParsed = JSON.parse(roomData[0])
    const roomState = JSON.parse(roomData[1]).state
    if (currentPlayersParsed && currentPlayersParsed.length === 1 && roomState === 'waiting') {
      await destroyRoom(userCurrentRoom)
    } else if (currentPlayersParsed && currentPlayersParsed.length > 1) {
      await deleteUserRoom(userId)
      currentPlayersParsed.splice(currentPlayersParsed.indexOf(userId), 1)
      await redisClient.hset(redisConfig.prefixes.rooms + userCurrentRoom, 'players', JSON.stringify(currentPlayersParsed))
      await redisClient.zincrby(redisConfig.prefixes.roomsList, -1, userCurrentRoom)
      io.of('/').adapter.remoteDisconnect(socket.id, true, async (err) => {
        logger.info('---------- remoteDisconnect-------------------')
        const gameLeft = require('../logics/gameLeft')(io, userId, gameMeta, marketKey, userCurrentRoom)
        await gameLeft.handleLeft()
        const methods = require('../redisHelper/room')(userCurrentRoom)
        await methods.addToLeaderboard(userId, false)
        if (currentPlayersParsed.length === 1) {
          await methods.makeRemainingPlayerWinner(userCurrentRoom)
        }
      })
    }
  }
}

const getUserData = async () => {
  const userData = await redisClient.hget(marketKey, userId)
  return JSON.parse(userData)
}

const setUserData = async (userDataParsed) => {
  await redisClient.hset(marketKey, userId, JSON.stringify(userDataParsed))
}

const removeUserSocketIdFromRedis = async () => {
  const userDataParsed = await getUserData()
  if (userDataParsed)
    delete userDataParsed['socketId']
  await setUserData(userDataParsed)
}

const addDisconnectStatusToUser = async () => {
  const userDataParsed = await getUserData()
  if (userDataParsed)
    userDataParsed['dc'] = true
  await setUserData(userDataParsed)
}

const sendMatchEvents = (roomId, code, event, data) => {
  io.to(roomId).emit('matchEvent', {
    code: code,
    event: event,
    data: data
  })
}

const changeSocketIdAndSocketRoom = async () => {
  const userData = await redisClient.hget(marketKey, userId)
  const userDataParsed = JSON.parse(userData)
  const roomId = await findUserCurrentRoom()
  const oldSocketId = userDataParsed.socketId
  const newSocketId = socket.id
  userDataParsed.socketId = newSocketId
  userDataParsed.dc = false
  await redisClient.hset(marketKey, userId, JSON.stringify(userDataParsed))
  io.of('/').adapter.remoteLeave(oldSocketId, roomId, (err) => {
    if (err)
      logger.info('err leaving socket' + userId)
    io.of('/').adapter.remoteJoin(newSocketId, roomId, (err) => {
      if (err)
        logger.info('err joining socket' + userId)
      logger.info('user: ' + userId + ' with socket id: ' + newSocketId + ' joined again to room: ' + roomId)
    })
  })
}

module.exports = {
  findAvailableRooms,
  kickUserFromRoomByDC,
  findUserCurrentRoom,
  changeSocketIdAndSocketRoom,
  leftRoom
}