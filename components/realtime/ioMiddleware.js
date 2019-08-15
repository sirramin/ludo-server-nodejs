const jwt = require('../../common/jwt')
const redisHelper = require('../redisHelper/user')

const auth = async (socket, next) => {
  if (socket.handshake.query && socket.handshake.query.token) {
    try {
      const userInfo = await jwt.verifyJwt(socket.handshake.query.token)
      socket.userInfo = userInfo
      socket.emit('message', userInfo)
      socket.emit('message', 'socket id: ' + socket.id)
      await redisHelper.addSocketIdToRedis(userInfo, socket.id)
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