const {getSocketId} = require('../redisHelper/user')

const exp = {}

exp.sendString = (roomId, string) => {
  io.to(roomId).emit('string', string)
}

exp.emitToSpecificPlayer = async (event, userId, buf) => {
  const socketId = await getSocketId(userId)
  io.binary(true).to(socketId).emit(event, buf);
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