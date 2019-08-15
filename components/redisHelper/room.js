const redisClient = require('../../common/redis-client')
const {gameMeta, redis: redisConfig} = require('../../common/config')

module.exports = (roomId) => {
  const roomsListPrefix = 'rooms:roomsList'
  const roomsPrefix = 'rooms:'
  const userRoomPrefix = 'user_room:'
  const leaderboardService = require('../leaderboard/service')

  const setProp = async (field, value) => {
    await redisClient.hset(roomsPrefix, field, value)
  }

  const setMultipleProps = async (...args) => {
    await redisClient.hmset(roomsPrefix, ...args)
  }

  const getProp = async (field) => {
    const value = await redisClient.hget(roomsPrefix, field)
    return JSON.parse(value)
  }

  const incrProp = async (field, number) => {
    return await redisClient.hincrby(roomsPrefix, field, number)
  }

  const getAllProps = async () => {
    return await redisClient.hgetall(roomsPrefix)
  }

  const deleteRoom = async (roomId) => {
    await redisClient.del(roomsPrefix)
    await redisClient.zrem(roomsListPrefix, roomId)
  }

  const kickUser = async (userId) => {
    const currentPlayers = await getProp('players')
    const socketId = await getUserSocketIdFromRedis(userId)
    if (currentPlayers.length > 1) {
      await deleteUserRoom(userId)
      currentPlayers.splice(currentPlayers.indexOf(userId), 1)
      await redisClient.hset(roomsPrefix, 'players', JSON.stringify(currentPlayers))
      await redisClient.zincrby(roomsListPrefix, -1, roomId)
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
    const userDataParsed = JSON.parse(await redisClient.hget(marketKey, userId))
    return userDataParsed.socketId
  }

  const deleteUserRoom = async (userId) => {
    return await redisClient.hdel(userRoomPrefix, userId)
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

  const addToLeaderboard = async (userId, isWinner) => {
    const roomInfo = await getProp('info')
    const userDataParsed = JSON.parse(await redisClient.hget(marketKey, userId))
    if (roomInfo && roomInfo.hasOwnProperty('leagueId')) {
      const leagueId = roomInfo.leagueId
      await leaderboardService.addScore(userDataParsed.name, userId, leagueId, isWinner)
    }
  }

  const getleaderboardRank = async (userId) => {
    return await leaderboardService.getRank(userId)
  }

  const getUserData = async (userId) => {
    return JSON.parse(await redisClient.hget(marketKey, userId))
  }

  const givePrize = async (userId, leagueId) => {
    return await leaderboardService.givePrize(userId, leagueId)
  }

  const findUserCurrentRoom = async () => {
    return await redisClient.hget(userRoomPrefix, userId)
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

  return {
    sendGameEvents,
    sendEventToSpecificSocket,
    setProp,
    setMultipleProps,
    getProp,
    getAllProps,
    kickUser,
    incrProp,
    makeRemainingPlayerWinner,
    broadcast,
    addToLeaderboard,
    deleteRoom,
    getleaderboardRank,
    getUserData,
    deleteUserRoom,
    givePrize,
    getRoomPlayers,
    getRoomPlayersWithNames
  }
}