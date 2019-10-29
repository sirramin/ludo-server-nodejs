const {loopOverAllRooms, createNewRoom, joinPlayerToRoom} = require('../redisHelper/room')
const redisHelperUser = require('../redisHelper/user')
const {errorBuf} = require('../../flatBuffers/error/data/error')

const findAvailableRooms = async (socket) => {

  const isPlayerJoinedBefore = await redisHelperUser.findUserCurrentRoom(socket.userId)
  if (isPlayerJoinedBefore) {
    socket.binary(true).emit('errorMessage', errorBuf('player already joined'))
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