const redisClient = require('../../common/redis-client')
const {gameMeta, redis: redisConfig} = require('../../common/config')

module.exports = (roomId) => {

  const setProp = async (field, value) => {
    await redisClient.hset(redisConfig.prefixes.rooms, field, value)
  }

  const setMultipleProps = async (...args) => {
    await redisClient.hmset(redisConfig.prefixes.rooms, ...args)
  }

  const getProp = async (field) => {
    const value = await redisClient.hget(redisConfig.prefixes.rooms, field)
    return JSON.parse(value)
  }

  const incrProp = async (field, number) => {
    return await redisClient.hincrby(redisConfig.prefixes.rooms, field, number)
  }

  const getAllProps = async () => {
    return await redisClient.hgetall(redisConfig.prefixes.rooms)
  }

  const deleteRoom = async (roomId) => {
    await redisClient.del(redisConfig.prefixes.rooms)
    await redisClient.zrem(redisConfig.prefixes.roomsList, roomId)
  }

  const kickUser = async (userId) => {
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

  const getUserSocketIdFromRedis = async (userId) => {
    const userDataParsed = JSON.parse(await redisClient.hget(redisConfig.prefixes.users, userId))
    return userDataParsed.socketId
  }

  const deleteUserRoom = async (userId) => {
    return await redisClient.hdel(redisConfig.prefixes.userRoom, userId)
  }

  const getUserData = async (userId) => {
    return JSON.parse(await redisClient.hget(redisConfig.prefixes.users, userId))
  }

  const findUserCurrentRoom = async () => {
    return await redisClient.hget(redisConfig.prefixes.userRoom, userId)
  }

  const getRoomPlayers = async (roomId) => {
    const roomHash = await redisClient.hmget(redisConfig.prefixes.rooms + roomId, 'info', 'players')
    const roomHashParsed = JSON.parse(roomHash[0])
    const roomPlayers = JSON.parse(roomHash[1])
    return roomPlayers
  }

  const getRoomPlayersWithNames = async (roomId) => {
    const roomPlayers = await getRoomPlayers(roomId)
    let roomPlayersWithNames = []
    for (let i = 0; i < roomPlayers.length; i++) {
      const playerNumber = (i + 1)
      const userData = await redisClient.hget(redisConfig.prefixes.rooms, roomPlayers[i])
      roomPlayersWithNames.push({player: playerNumber, userId: roomPlayers[i], name: JSON.parse(userData).name})
    }
    return roomPlayersWithNames
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

  const createNewRoom = async (leagueId, socket) => {
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


  return {
    sendGameEvents,
    sendEventToSpecificSocket,
    setProp,
    setMultipleProps,
    getProp,
    getAllProps,
    kickUser,
    incrProp,
    broadcast,
    deleteRoom,
    getUserData,
    deleteUserRoom,
    getRoomPlayers,
    getRoomPlayersWithNames,
    createNewRoom,
    findUserCurrentRoom,
    destroyRoom
  }
}