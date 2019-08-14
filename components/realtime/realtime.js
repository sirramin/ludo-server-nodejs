const jwt = require('../../common/jwt')
const redisHelper = require('../redisHelper/redis')

module.exports = () => {
  io
    .use(async (socket, next) => {
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
    })
    .on('connection', async (socket) => {
      const monitor = require('socket.io-monitor')
      const {emitter} = monitor.bind(io, {server: false})
      emitter.getState()
      emitter.on('join', ({id, rooms}) => logger.info('socket id: ' + id + ' joins room: ' + rooms))

      logger.info('socket.id connected:' + socket.id)
      const matchMaking = require('./matchMaking')(socket)
      // const friendly = require('./friendly')(io, socket, gameMeta)
      await redisHelper.addOnlineStatus(socket.userInfo, true)
      //must merge
      const isConnectedBefore = await redisHelper.checkIsConnectedBefore(socket.userInfo)
      if (isConnectedBefore) {
        await matchMaking.changeSocketIdAndSocketRoom()
        // const hasRoomBefore = await checkHasRoomBefore(socket.userInfo)
        // if (hasRoomBefore) matchMaking.returnUserToGame(hasRoomBefore)      //hasRoomBefore = roomId
      }
      socket.on('joinRoom', async (leagueId) => {
        await matchMaking.findAvailableRooms(leagueId)
      })
      socket.on('invite', async (usernamesArray) => {
        await friendly.invite(usernamesArray)
      })
      socket.on('joinFriendly', async (usernamesArray) => {
        await friendly.invite(usernamesArray)
      })
      socket.on('leftRoom', async () => {
        await matchMaking.leftRoom()
      })
      socket.on('disconnect', async (reason) => {
        await redisHelper.addOnlineStatus(socket.userInfo, false)
        await matchMaking.kickUserFromRoomByDC()
      })
      socket.on('event', async (msg) => {
        const eventData = JSON.parse(msg)
        const logicEvents = require('../logics/gameEvents')(socket)
        logicEvents.getAct(eventData)
      })
      socket.on('message', (message) => {
        const messageData = JSON.parse(msg)
        logger.info(messageData)
      })
    })
}