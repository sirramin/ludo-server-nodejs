const jwt = require('../../common/jwt')
module.exports = (router, io) => {
    io
        .use(async (socket, next) => {
            if (socket.handshake.query && socket.handshake.query.token) {
                try {
                    const userInfo = await jwt.verifyJwt(socket.handshake.query.token)
                    socket.emit('message', userInfo)
                    next()
                }
                catch (err) {
                    socket.emit('message', 'Unauthorized')
                    next('Unauthorized')
                }
            } else {
                next('header token is required!')
            }
        })
        .on('connection', function (socket) {
            socket.on('message', function (message) {
                io.emit('message', message);
            });
        });
}