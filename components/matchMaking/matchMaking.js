const redisClient = require('../../common/redis-client')
const {gameMeta, redis: redisConfig} = require('../../common/config')
const matchMakingHelper = require('./matchMakingHelper')
const redisHelperRoom = require('../redisHelper/room')
const redisHelperUser = require('../redisHelper/user')
const redisHelperLeaderboard = require('../redisHelper/leaderboard')
const gameLeft = require('../logics/gameLeft')

const findAvailableRooms = async (leagueId, socket) => {
  leagueId = leagueId ? leagueId : 1
  const isPlayerJoinedBefore = await redisHelperUser.findUserCurrentRoom(socket.userId)
  if (isPlayerJoinedBefore) {
    socket.emit('matchEvent', 'playerAlreadyJoined')
    return
  }
  const foundedRoom = await matchMakingHelper.loopOverAllRooms(null, leagueId)
  let roomId
  if (!foundedRoom) {
    roomId = await redisHelperRoom.createNewRoom(leagueId, socket)
  }
  await matchMakingHelper.joinPlayerToRoom(roomId, socket)

}

const kickUserFromRoomByDC = async (socket) => {
  const userId = socket.userInfo.userId
  await redisHelperUser.removeUserSocketIdFromRedis()
  await redisHelperUser.addDisconnectStatusToUser()
  const userCurrentRoom = await redisHelperRoom.findUserCurrentRoom()
  if (userCurrentRoom) {
    setTimeout(async () => {
      const userDataParsed = await redisHelperUser.getUserData(userId)
      if (userDataParsed && userDataParsed.hasOwnProperty('dc') && userDataParsed.dc) {
        const roomData = await redisClient.hmget(redisConfig.prefixes.rooms + userCurrentRoom, 'players', 'info')
        if (roomData[0]) {
          const currentPlayersParsed = JSON.parse(roomData[0])
          const roomState = JSON.parse(roomData[1]).state
          if (currentPlayersParsed && currentPlayersParsed.length === 1 && roomState === 'waiting') {
            await redisHelperRoom.destroyRoom(userCurrentRoom)
          } else if (currentPlayersParsed && currentPlayersParsed.length > 1) {
            await redisHelperRoom.deleteUserRoom(userId)
            currentPlayersParsed.splice(currentPlayersParsed.indexOf(userId), 1)
            await redisClient.hset(redisConfig.prefixes.rooms + userCurrentRoom, 'players', JSON.stringify(currentPlayersParsed))
            await redisClient.zincrby(redisConfig.prefixes.roomsList, -1, userCurrentRoom)
            io.of('/').adapter.remoteDisconnect(socket.id, true, async (err) => {
              logger.info('---------- remoteDisconnect-------------------')
              await gameLeft.handleLeft()
              await redisHelperLeaderboard.addToLeaderboard(userId, false)
              if (currentPlayersParsed.length === 1) {
                await matchMakingHelper.makeRemainingPlayerWinner(userCurrentRoom)
              }
            })
          }
        }
      }
    }, gameMeta.kickTime)
  }
}

const leftRoom = async (socket) => {
  const userId = socket.userInfo.userId
  await redisHelperUser.removeUserSocketIdFromRedis()
  await redisHelperUser.addDisconnectStatusToUser()
  const userCurrentRoom = await redisHelperRoom.findUserCurrentRoom()
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
        await methods.addToLeaderboard(userId, false)
        if (currentPlayersParsed.length === 1) {
          await methods.makeRemainingPlayerWinner(userCurrentRoom)
        }
      })
    }
  }
}

module.exports = {
  findAvailableRooms,
  kickUserFromRoomByDC,
  leftRoom
}