const {getSocketId} = require('../redisHelper/user')

const exp = {}

exp.emitToAll = async (event, roomId, buf) => {
  io.binary(true).to(roomId).emit(event, buf)
}

exp.emitToSpecificPlayer = async (event, userId, buf) => {
  const socketId = await getSocketId(userId)
  io.binary(true).to(socketId).emit(event, buf)
}

exp.broadcast = async (socket, msg) => {
  socket.broadcast.emit('gameEvent', {
    code: 85,
    event: 'chat',
    data: msg
  })
}

exp.joinRoom = (socketId, roomId) => {
  io.of('/').adapter.remoteJoin(socketId, roomId)
}

exp.leaveRoom = async (userId, roomId) => {
  const socketId = await getSocketId(userId)
  io.of('/').adapter.remoteLeave(socketId, roomId)
}

exp.disconnect = async (userId) => {
  const socketId = await getSocketId(userId)
  io.of('/').adapter.remoteDisconnect(socketId, true)
}

exp.logClientRooms = async (userId) => {
  const socketId = await getSocketId(userId)
  io.of('/').adapter.clientRooms(socketId, (err, rooms) => {
    console.log('client Rooms:' + rooms.length); // an array containing every room a given id has joined.
  })
}

module.exports = exp