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

exp.leaveRoom = (socketId, roomId) => {
  io.of('/').adapter.remoteLeave(socketId, roomId)
}

module.exports = exp