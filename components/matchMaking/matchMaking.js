const {loopOverAllRooms, createNewRoom, joinPlayerToRoom} = require('../redisHelper/room')
const redisHelperUser = require('../redisHelper/user')
const {errorBuf} = require('../../flatBuffers/error/data/error')

const findAvailableRooms = async (socket) => {
  const buf = errorBuf('sssssssssssssssssssssssss')
  socket.emit('errorMessage', buf)

  const isPlayerJoinedBefore = await redisHelperUser.findUserCurrentRoom(socket.userId)
  if (isPlayerJoinedBefore) {
    socket.emit('error', 'playerAlreadyJoined')
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