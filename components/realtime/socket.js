const redisHelperUser = require('../redisHelper/user')
const matchMaking = require('../matchMaking/matchMaking')
// const friendly = require('./friendly')(io, socket, gameMeta)
const {rollDice, move} = require('../logics/events/gameEvents')
const ioMiddleware = require('../../middleware/ioMiddleware')

io
  .use(ioMiddleware)
  .on('connection', async (socket) => {
    const {userId, id} = socket
    logger.info('socket.id connected:' + id)
    await redisHelperUser.addOnlineStatus(userId, true)
    await redisHelperUser.changeSocketId(userId, id)

    socket.on('disconnect', async (reason) => {
      await redisHelperUser.addOnlineStatus(userId, false)
      await redisHelperUser.removeSocketId(userId, id)
      // await matchMaking.kickUserFromRoomByDC()
    })

    socket.on('joinRoom', async () => {
      await matchMaking.findAvailableRooms(socket)
    })

    socket.on('leftRoom', async () => {
      await matchMaking.leftRoom()
    })

    socket.on('rollDice', async () => {
      rollDice(userId)
    })

    socket.on('move', async (marbleNumber) => {
      move(userId, marbleNumber)
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