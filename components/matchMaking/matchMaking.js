const {loopOverAllRooms, createNewRoom, joinPlayerToRoom} = require('../redisHelper/room')
const redisHelperUser = require('../redisHelper/user')
const {stringBuf} = require('../../flatBuffers/str/data/str')

const findAvailableRooms = async (socket) => {

  const isPlayerJoinedBefore = await redisHelperUser.findUserCurrentRoom(socket.userId)
  if (isPlayerJoinedBefore) {
    socket.binary(true).emit('errorMessage', stringBuf('player already joined'))
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