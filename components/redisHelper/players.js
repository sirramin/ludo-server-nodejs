const redisClient = require('../../common/redis-client')
const {redis: redisConfig} = require('../../common/config')
const {getUsername} = require('./user')
const exp = {}

const getRoomPlayers = async (roomId) => {
  return await redisClient.smembers(redisConfig.prefixes.roomPlayers + roomId)
}

exp.getRoomPlayersWithNames = async (roomId) => {
  const roomPlayers = await getRoomPlayers(roomId)
  let roomPlayersWithNames = []
  for (let i = 0; i < roomPlayers.length; i++) {
    const playerNumber = (i + 1)
    const username = await getUsername(roomPlayers[i])
    roomPlayersWithNames.push({player: playerNumber, userId: roomPlayers[i], username})
  }
  return roomPlayersWithNames
}

exp.addPlayerTooRoom = async (roomId, userId) => {
  await redisClient.sadd(redisConfig.prefixes.roomPlayers + roomId, userId)
}

exp.numberOfPlayersInRoom = async (roomId) => {
  return await redisClient.scard(redisConfig.prefixes.roomPlayers + roomId)
}

exp.removePlayerFromRoom = async (roomId, userId) => {
  await redisClient.sadd(redisConfig.prefixes.roomPlayers + roomId, userId)
}

exp.removeAlPlayerFromRoom = async (roomId) => {
  await redisClient.del(redisConfig.prefixes.roomPlayers + roomId)
}

module.exports = exp