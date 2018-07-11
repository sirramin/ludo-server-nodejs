const jwt = require('../../common/jwt'),
    redisClient = require('../../common/redis-client'),
    gameIdentifier = require('../../common/gameIdentifier')

module.exports = (router, io) => {
    io
        .use(async (socket, next) => {
            if (socket.handshake.query && socket.handshake.query.token) {
                try {
                    const userInfo = await jwt.verifyJwt(socket.handshake.query.token)
                    socket.userInfo = userInfo
                    socket.emit('message', userInfo)
                    next()
                }
                catch (err) {
                    // socket.emit('message', 'Unauthorized')
                    next('Unauthorized')
                }
            } else {
                next('header token is required!')
            }
        })
        .on('connection', async (socket) => {
            const gameMeta = await gameIdentifier.getGameMeta(socket.userInfo.dbUrl)
            socket.on('join', function (message) {
                joinPlayerToRoom(socket, gameMeta)
            });
            socket.on('chat message', function (message) {
                io.emit('message', 'message recived: ' + message);
            });
        });

    const joinPlayerToRoom = async (socket, gameMeta) => {
            redisClient.

    }

    const findAvailableRooms = async (socket, gameMeta) => {
        for (let i = gameMeta.roomCapacity - 1; i < gameMeta.roomMin; i--) {
            redisClient.ZRANGEBYSCORE()
        }
    }
}