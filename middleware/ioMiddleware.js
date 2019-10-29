const jwt = require('../common/jwt')
const redisHelper = require('../components/redisHelper/user')

const {stringBuf} = require('../flatBuffers/str/data/str')


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
      socket.binary(true).emit('errorMessage', stringBuf('unauthorized'))
    }
  } else {
    socket.binary(true).emit('errorMessage', stringBuf('unauthorized'))
  }
}

module.exports = auth