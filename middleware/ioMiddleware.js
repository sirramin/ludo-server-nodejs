const jwt = require('../common/jwt')
const redisHelper = require('../components/redisHelper/user')

const auth = async (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    try {
      const {userId} = await jwt.verifyJwt(socket.handshake.query.token)
      socket.userId = userId
      // socket.emit('message', 'user id: ' + userId)
      // socket.emit('message', 'socket id: ' + socket.id)
      await redisHelper.addSocketIdToRedis(userId, socket.id)
      next()
    } catch (err) {
      // socket.emit('message', 'Unauthorized')
      next('Unauthorized')
    }
  } else {
    next('header token is required!')
  }
}

module.exports = auth