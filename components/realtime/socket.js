const redisHelperUser = require('../redisHelper/user')
const matchMaking = require('../matchMaking/matchMaking')
// const friendly = require('./friendly')(io, socket, gameMeta)
const logicEvents = require('../logics/gameEvents')
const ioMiddleware = require('../../middleware/ioMiddleware')

  io
    .use(ioMiddleware)
    .on('connection', async (socket) => {
      logger.info('socket.id connected:' + socket.id)
      await redisHelperUser.addOnlineStatus(socket.userId, true)
      await redisHelperUser.changeSocketId(socket.userId, socket.id)
      // const hasRoomBefore = await checkHasRoomBefore(socket.userInfo)
      // if (hasRoomBefore) matchMaking.returnUserToGame(hasRoomBefore)      //hasRoomBefore = roomId
      socket.on('joinRoom', async (leagueId) => {
        await matchMaking.findAvailableRooms(leagueId, socket)
      })
      socket.on('leftRoom', async () => {
        await matchMaking.leftRoom()
      })
      socket.on('disconnect', async (reason) => {
        await redisHelperUser.addOnlineStatus(socket.userInfo, false)
        // await matchMaking.kickUserFromRoomByDC()
      })
      socket.on('event', async (msg) => {
        const eventData = JSON.parse(msg)
        await logicEvents.getAct(eventData)
      })
      socket.on('message', (message) => {
        const messageData = JSON.parse(message)
        logger.info(messageData)
      })
      // socket.on('invite', async (usernamesArray) => {
      //   await friendly.invite(usernamesArray)
      // })
      // socket.on('joinFriendly', async (usernamesArray) => {
      //   await friendly.invite(usernamesArray)
      // })
    })