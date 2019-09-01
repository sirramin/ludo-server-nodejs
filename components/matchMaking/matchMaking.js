const {loopOverAllRooms, createNewRoom, joinPlayerToRoom} = require('../redisHelper/room')
const redisHelperUser = require('../redisHelper/user')

const findAvailableRooms = async (leagueId, socket) => {
  leagueId = leagueId ? leagueId : 1
  const isPlayerJoinedBefore = await redisHelperUser.findUserCurrentRoom(socket.userId)
  if (isPlayerJoinedBefore) {
    socket.emit('matchEvent', 'playerAlreadyJoined')
    return
  }
  let roomId = await loopOverAllRooms(null, leagueId)
  if (!roomId) {
    roomId = await createNewRoom(leagueId)
  }
  await joinPlayerToRoom(roomId, socket)
}

module.exports = {
  findAvailableRooms
}