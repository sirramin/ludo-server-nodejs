const redisHelper = require('../redisHelper/user')
const matchMaking = require('./matchMaking')
// const friendly = require('./friendly')(io, socket, gameMeta)
const logicEvents = require('../logics/gameEvents')
const ioMiddleware = require('ioMiddleware')

  io
    .use(ioMiddleware)
    .on('connection', async (socket) => {
      logger.info('socket.id connected:' + socket.id)
      await redisHelper.addOnlineStatus(socket.userInfo, true)
      //must merge
      const isConnectedBefore = await redisHelper.checkIsConnectedBefore(socket.userInfo)
      if (isConnectedBefore) {
        await matchMaking.changeSocketIdAndSocketRoom()
        // const hasRoomBefore = await checkHasRoomBefore(socket.userInfo)
        // if (hasRoomBefore) matchMaking.returnUserToGame(hasRoomBefore)      //hasRoomBefore = roomId
      }
      socket.on('joinRoom', async (leagueId) => {
        await matchMaking.findAvailableRooms(leagueId, socket)
      })
      // socket.on('invite', async (usernamesArray) => {
      //   await friendly.invite(usernamesArray)
      // })
      // socket.on('joinFriendly', async (usernamesArray) => {
      //   await friendly.invite(usernamesArray)
      // })
      socket.on('leftRoom', async () => {
        await matchMaking.leftRoom()
      })
      socket.on('disconnect', async (reason) => {
        await redisHelper.addOnlineStatus(socket.userInfo, false)
        await matchMaking.kickUserFromRoomByDC()
      })
      socket.on('event', async (msg) => {
        const eventData = JSON.parse(msg)
        logicEvents.getAct(eventData)
      })
      socket.on('message', (message) => {
        const messageData = JSON.parse(message)
        logger.info(messageData)
      })
    })