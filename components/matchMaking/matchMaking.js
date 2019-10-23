const {loopOverAllRooms, createNewRoom, joinPlayerToRoom} = require('../redisHelper/room')
const redisHelperUser = require('../redisHelper/user')

const findAvailableRooms = async (socket) => {
  const isPlayerJoinedBefore = await redisHelperUser.findUserCurrentRoom(socket.userId)
  if (isPlayerJoinedBefore) {
    socket.emit('matchEvent', 'playerAlreadyJoined')
    return
  }
  let roomId = await loopOverAllRooms(null)
  if (!roomId) {
    roomId = await createNewRoom()
  }
  await joinPlayerToRoom(roomId, socket)
}

module.exports = {
  findAvailableRooms
}