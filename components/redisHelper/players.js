const redisClient = require('../../common/redis-client')
const {redis: {prefixes: {roomPlayers}}} = require('../../common/config')
const {getUsername, updateUserRoom, deleteUserRoom} = require('./user')
const {updateRoomsListCount} = require('./roomList')
const exp = {}

exp.getRoomPlayers = async (roomId) => {
  return await redisClient.smembers(roomPlayers + roomId)
}

exp.getRoomPlayersWithNames = async (roomId) => {
  const roomPlayers = await exp.getRoomPlayers(roomId)
  let roomPlayersWithNames = []
  for (let i = 0; i < roomPlayers.length; i++) {
    const playerNumber = (i + 1)
    const username = await getUsername(roomPlayers[i])
    roomPlayersWithNames.push({player: playerNumber, userId: roomPlayers[i], username})
  }
  return roomPlayersWithNames
}

exp.numberOfPlayersInRoom = async (roomId) => {
  return await redisClient.scard(roomPlayers + roomId)
}

exp.addPlayerTooRoom = async (roomId, userId) => {
  redisClient.sadd(roomPlayers + roomId, userId)
  updateRoomsListCount(roomId, 1)
  await updateUserRoom(roomId, userId)
}

exp.removePlayerFromRoom = async (roomId, userId) => {
  redisClient.srem(roomPlayers + roomId, userId)
  await updateRoomsListCount(roomId, -1)
  await deleteUserRoom(userId)
}

exp.removeAlPlayerFromRoom = async (roomId) => {
  await redisClient.del(roomPlayers + roomId)
}

module.exports = exp