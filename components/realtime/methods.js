const redisClient = require('../../common/redis-client')

module.exports = (io, gameMeta, roomId) => {
    const roomPrefix = gameMeta.name + ':rooms:' + roomId

    const sendGameEvents = (code, event, data) => {
        io.to(roomId).emit('gameEvents', {
            code: code,
            event: event,
            data: JSON.stringify(data)
        })
    }

    const setProp = async (field, value) => {
        await redisClient.hset(roomPrefix, field, value)
    }

    const setMultipleProps = async (...args) => {
        await redisClient.hmset(roomPrefix, ...args)
    }

    const getProp = async (field) => {
        const value = await redisClient.hget(roomPrefix, field)
        return JSON.parse(value)
    }

    const getMultipleProps = async (...args) => {
        await redisClient.hmget(roomPrefix, ...args)
    }

    return {
        sendGameEvents: sendGameEvents,
        setProp: setProp,
        setMultipleProps: setMultipleProps,
        getProp: getProp,
        getMultipleProps: getMultipleProps
    }
}