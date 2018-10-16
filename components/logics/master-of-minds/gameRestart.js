const _ = require('lodash'),
    redisClient = require('../../../common/redis-client')

module.exports.handler = async (roomId, methods) => {
    const roomFields = await redisClient.HMGET('master-of-minds:rooms:' + roomId, 'players', 'positions'),
    gameStart = require('./gameStart')(roomId, JSON.parse(roomFields[0]), JSON.parse(roomFields[1]), methods)
    gameStart.timerCounter1(methods)
    gameStart.timerCounter2(methods)
}


