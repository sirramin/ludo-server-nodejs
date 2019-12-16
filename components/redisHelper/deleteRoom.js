const room = require('./room')

const deleteRoomCycle = async (roomId) => {
   await room.deleteRoom(roomId)
}

module.exports = deleteRoomCycle