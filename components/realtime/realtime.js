const jwt = require('../../common/jwt'),
    gameIdentifier = require('../../common/gameIdentifier')
module.exports = (io) => {
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
            const matchMaking = require('./matchMaking')(socket, gameMeta)
            socket.on('joinRoom', (message) => {
                matchMaking.findAvailableRooms()
            });
            socket.on('chat message', (message) => {
                io.emit('message', 'message recived: ' + message);
            });
        });
}