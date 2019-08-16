
const sendMatchEvents = (roomId, code, event, data) => {
    io.to(roomId).emit('matchEvent', {
        code: code,
        event: event,
        data: data
    })
}

const sendGameEvents = (code, event, data) => {
    io.to(roomId).emit('gameEvent', {
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

const leaveRoom = (socketId, roomId) => {
    io.of('/').adapter.remoteLeave(socketId, roomId)
}

const joinRoom = (socketId, roomId) => {
    io.of('/').adapter.remoteJoin(socketId, roomId)
}


module.exports = {
    sendMatchEvents,
}