
const sendMatchMakingEvents = (roomId, data) => {
    io.to(roomId).emit('matchMaking', data)
}

const sendGameEvents = (code, event, data) => {
    io.to(roomId).emit(event, {
        code: code,
        event: event,
        data: data
    })
}

const sendEventToSpecificSocket = async (userId, code, event, data) => {
    const userData = await redisClient.hget(marketKey, userId),
      socketId = JSON.parse(userData).socketId
    io.to(socketId).emit('gameEvent', {
        code: code,
        event: event,
        data: data
    });
}

const broadcast = async (socket, msg) => {
    socket.broadcast.emit('gameEvent', {
        code: 85,
        event: 'chat',
        data: msg
    })
}

const joinRoom = (socketId, roomId) => {
    io.of('/').adapter.remoteJoin(socketId, roomId)
}

const leaveRoom = (socketId, roomId) => {
    io.of('/').adapter.remoteLeave(socketId, roomId)
}

module.exports = {
    sendMatchMakingEvents,
    sendGameEvents,
    sendEventToSpecificSocket,
    broadcast,
    joinRoom,
    leaveRoom
}