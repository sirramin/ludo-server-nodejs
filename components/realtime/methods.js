const redisClient = require('../../common/redis-client')

module.exports = (io, socket, gameMeta, roomId) => {
const roomPrefix = gameMeta.name + ':rooms:' + roomId
    const sendMessage = (msg) => {
        io.to(roomId).emit('message', msg)
    }

    const setProp = (field, value) => {
        redisClient.hset(roomPrefix, field, value)
    }

    const getProp = (field, value) => {
        redisClient.hget(roomPrefix, field)
    }

    return {
        sendMessage: sendMessage,
        setProp: setProp,
        getProp: getProp
    }
}