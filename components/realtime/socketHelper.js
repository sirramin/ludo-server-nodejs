const exp = {}

exp.sendString = (roomId, string) => {
  io.to(roomId).emit('string', string)
}

exp.sendJson = (roomId, json) => {
  io.to(roomId).emit('json', json)
}

exp.sendGameEvents = (code, event, data) => {
  io.to(roomId).emit(event, {
    code: code,
    event: event,
    data: data
  })
}

exp.sendEventToSpecificSocket = async (userId, code, event, data) => {
  const userData = await redisClient.hget(marketKey, userId),
    socketId = JSON.parse(userData).socketId
  io.to(socketId).emit('gameEvent', {
    code: code,
    event: event,
    data: data
  });
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

exp.loger = () => {
  console.log(3333333333333)
}

module.exports = exp