const redisClient = require('../../common/redis-client'),
    uniqid = require('uniqid')

module.exports = (io, socket, gameMeta) => {
    const userId = socket.userInfo.userId,
        roomsListPrefix = gameMeta.name + ':rooms:roomsList',
        roomsPrefix = gameMeta.name + ':rooms:',
        marketName = (socket.userInfo.market === 'mtn' || socket.userInfo.market === 'mci') ? socket.userInfo.market : 'market',
        marketKey = gameMeta.name + ':users:' + marketName

    const findAvailableRooms = async () => {
        try {
            const isPlayerJoinedBefore = await findUserCurrentRoom()
            if (isPlayerJoinedBefore) {
                socket.emit('matchEvent', {
                    code: 1,
                    event: 'playerAlreadyJoined'
                })
                return
            }
            const foundedRoom = await asyncLoop()
            if (!foundedRoom)
                createNewRoom()
            else
                joinPlayerToRoom(foundedRoom)
        }
        catch (e) {
            logger.error(e.message)
        }
    }

    const findUserCurrentRoom = async () => {
        const userData = await redisClient.hget(marketKey, userId)
        if (userData) {
            const userDataParsed = JSON.parse(userData)
            return userDataParsed.roomId ? userDataParsed.roomId : null
        }
        else
            return userData
    }

    const asyncLoop = async (i) => {
        i = i || gameMeta.roomMax - 1
        for (i; i >= 1; i--) {
            const args = [roomsListPrefix, i, i]
            const availableRooms = await redisClient.ZRANGEBYSCORE(args)
            if (availableRooms.length) {
                return await asyncForeach(availableRooms, i)
            }
        }
        return false
    }

    const asyncForeach = async (availableRooms, i) => {
        for (let j = 1; j <= availableRooms.length; j++) {
            const roomCurrentInfo = await redisClient.HGET(roomsPrefix + availableRooms[j - 1], 'info')
            const roomCurrentInfoParsed = JSON.parse(roomCurrentInfo)
            if (roomCurrentInfoParsed && roomCurrentInfoParsed.state === 'waiting') {
                return roomCurrentInfoParsed.roomId
            }
        }
        if (i > 1)
            return await asyncLoop(i - 1)
        return false
    }

    const joinPlayerToRoom = async (roomId) => {
        const roomCurrentData = await redisClient.HMGET(roomsPrefix + roomId, 'info', 'players')
        let currentPlayers = JSON.parse(roomCurrentData[1])
        let roomInfo = JSON.parse(roomCurrentData[0])
        const currentPlayersLength = currentPlayers.length
        let newState
        if (currentPlayersLength === 4)
            socket.emit('matchEvent', {
                code: 2,
                event: 'roomIsFull'
            })
        currentPlayersLength === 3 ? newState = "started" : newState = "waiting"
        roomInfo.state = newState
        currentPlayers.push(userId)
        await redisClient.HMSET(roomsPrefix + roomId, 'info', JSON.stringify(roomInfo), 'players', JSON.stringify(currentPlayers))
        await redisClient.ZINCRBY(roomsListPrefix, 1, roomId)
        await updateUserRoom(roomId)
        socket.join(roomId)
        sendMatchEvents(roomId, 3, 'playerJoined', {
            roomId: roomId
        })
        if (newState === "started")
            gameStart(roomId, 'room fulled')
    }

    const createNewRoom = async () => {
        const roomId = uniqid()
        const currentTimeStamp = new Date().getTime()
        const newRoomInfo = {
            "roomId": roomId,
            "state": "waiting",
            "creationDateTime": currentTimeStamp,
            "marketKey": marketKey
        }
        const newRoomPlayers = [socket.userInfo.userId]
        const hmArgs = [roomsPrefix + roomId, 'info', JSON.stringify(newRoomInfo), 'players', JSON.stringify(newRoomPlayers)]
        await redisClient.HMSET(hmArgs)
        await redisClient.ZADD(roomsListPrefix, 1, roomId)
        await updateUserRoom(roomId)
        socket.join(roomId)
        sendMatchEvents(roomId, 3, 'playerJoined', {
            roomId: roomId
        })
        setTimeout(() => {
            roomWaitingTimeOver(roomId)
        }, gameMeta.waitingTime)
    }

    const updateUserRoom = async (roomId, anyUserId) => {
        const user_id = anyUserId ? anyUserId : userId
        const userData = await redisClient.HGET(marketKey, user_id)
        const userDataParsed = JSON.parse(userData)
        if (!userDataParsed.roomId)
            userDataParsed.roomId = roomId
        else
            delete userDataParsed.roomId
        await redisClient.hset(marketKey, userDataParsed.userId, JSON.stringify(userDataParsed))
    }

    const roomWaitingTimeOver = async (roomId) => {
        const roomCurrentInfo = await redisClient.HMGET(roomsPrefix + roomId, 'info', 'players')
        if (roomCurrentInfo) {
            const currentPlayers = JSON.parse(roomCurrentInfo[1]).length
            const roomState = JSON.parse(roomCurrentInfo[0]).state
            if (currentPlayers >= gameMeta.roomMin && roomState !== 'started')
                gameStart(roomId, 'time over')
            else if (roomState !== 'started')
                destroyRoom(roomId)
        }
    }

    const gameStart = async (roomId, reason) => {
        io.of('/').adapter.allRooms((err, rooms) => {
            logger.info('all socket io rooms: ' + rooms) // an array containing all rooms (accross every node)
        })
        sendMatchEvents(roomId, 4, 'gameStarted', {
            roomId: roomId
        })
        const roomHash = await redisClient.HMGET(roomsPrefix + roomId, 'info', 'players')
        const roomHashParsed = JSON.parse(roomHash[0])
        const roomPlayers = JSON.parse(roomHash[1])
        roomHashParsed.state = 'started'
        await redisClient.HSET(roomsPrefix + roomId, 'info', JSON.stringify(roomHashParsed))
        const webHookCaller = require('./webHookCaller')(gameMeta, roomId, roomPlayers, marketKey)
        return await webHookCaller.start()
    }

    const destroyRoom = async (roomId) => {
        const roomplayers = await redisClient.hget(roomsPrefix + roomId, 'players')
        const roomplayersArray = JSON.parse(roomplayers)
        await asyncLoopRemovePlayersRoomInRedis(roomplayersArray, roomId)

        await redisClient.DEL(roomsPrefix + roomId)
        await redisClient.ZREM(roomsListPrefix, roomId)
        sendMatchEvents(roomId, 5, 'roomDestroyed', {
            roomId: roomId
        })
        io.of('/').in(roomId).clients((error, clients) => {
            if (error) logger.error(error)
            if (clients.length) {
                clients.forEach(client => io.of('/').adapter.remoteLeave(client, roomId));
            }
        })
        logger.info(roomId + ' destroyed ')
    }

    const asyncLoopRemovePlayersRoomInRedis = async (roomplayersArray, roomId) => {
        for (let i = 0; i < roomplayersArray.length; i++) {
            await updateUserRoom(roomId, roomplayersArray[i])
        }
    }

    const kickUserFromRoomByDC = async () => {
        const userCurrentRoom = await findUserCurrentRoom()
        if (userCurrentRoom) {
            const dcTimeout = setTimeout(async () => {
                const roomData = await redisClient.hmget(roomsPrefix + userCurrentRoom, 'players', 'info', 'positions')
                const currentpaylersParsed = JSON.parse(roomData[0])
                const roomState = JSON.parse(roomData[1]).state
                const positions = JSON.parse(roomData[2])
                if (currentpaylersParsed && currentpaylersParsed.length === 1 && roomState === 'waiting') {
                    destroyRoom(userCurrentRoom)
                }
                else if (currentpaylersParsed && currentpaylersParsed.length > 1) {
                    await updateUserRoom(userCurrentRoom)
                    currentpaylersParsed.splice(currentpaylersParsed.indexOf(userId), 1)
                    positions.splice(currentpaylersParsed.indexOf(userId), 1)
                    await redisClient.HSET(roomsPrefix + userCurrentRoom, 'players', JSON.stringify(currentpaylersParsed))
                    await redisClient.ZINCRBY(roomsListPrefix, -1, userCurrentRoom)
                }
                socket.leave(userCurrentRoom)
                sendMatchEvents(userCurrentRoom, 6, 'playerLeft', {
                    userId: userId
                })
            }, gameMeta.kickTime)
        }
    }

    const sendMatchEvents = (roomId, code, event, data) => {
        io.to(roomId).emit('matchEvent', {
            code: code,
            event: event,
            data: data
        })
    }

    const reconnect = () => {

    }

    return {
        findAvailableRooms: findAvailableRooms,
        kickUserFromRoomByDC: kickUserFromRoomByDC,
        findUserCurrentRoom: findUserCurrentRoom,
        reconnect: reconnect
    }
}