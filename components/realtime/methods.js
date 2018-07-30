const redisClient = require('../../common/redis-client')

module.exports = (io, gameMeta, roomId) => {
    const roomPrefix = gameMeta.name + ':rooms:' + roomId

    const sendGameEvents = (code, msg, data) => {
        io.to(roomId).emit('gameEvents', {
            code: code,
            msg: msg,
            data: data
        })
    }

    const setProp = async (field, value) => {
        await redisClient.hset(roomPrefix, field, value)
    }

    const setMultipleProps = async (...args) => {
        await redisClient.hmset(roomPrefix, ...args)
    }

    const getProp = async (field) => {
        await redisClient.hget(roomPrefix, field)
    }

    return {
        sendGameEvents: sendGameEvents,
        setProp: setProp,
        setMultipleProps: setMultipleProps,
        getProp: getProp
    }
}