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
                socket.emit('message', {
                    code: 1,
                    msg: 'player already joined room'
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

    const asyncLoop = async () => {
        for (let i = gameMeta.roomMax - 1; i >= 1; i--) {
            const args = [roomsListPrefix, i, i]
            const availableRooms = await redisClient.ZRANGEBYSCORE(args)
            if (availableRooms.length) {
                return await asyncForeach(availableRooms)
            }
        }
        return false
    }

    const asyncForeach = async (availableRooms) => {
        for (let i = 0; i <= availableRooms.length; i++) {
            const roomCurrentInfo = await redisClient.HGET(roomsPrefix + availableRooms[i], 'info')
            const roomCurrentInfoParsed = JSON.parse(roomCurrentInfo)
            if (roomCurrentInfoParsed.state === 'waiting') {
                return roomCurrentInfoParsed.roomId
            }
        }
        return false
    }

    const joinPlayerToRoom = async (roomId) => {
        const roomCurrentInfo = await redisClient.HMGET(roomsPrefix + roomId, 'info', 'players')
        const currentPlayers = JSON.parse(roomCurrentInfo[1])
        const currentPlayersLength = currentPlayers.length
        let newState
        if (currentPlayersLength === 4)
            socket.emit('message', 'Room is full')

        currentPlayersLength === 3 ? newState = "started" : newState = "waiting"

        const roomInfo = {
            "roomId": roomId,
            "state": newState,
            "creationDateTime": JSON.parse(roomCurrentInfo[0]).creationDateTime
        }
        currentPlayers.push(userId)
        await redisClient.HMSET(roomsPrefix + roomId, 'info', JSON.stringify(roomInfo), 'players', JSON.stringify(currentPlayers))
        await redisClient.ZINCRBY(roomsListPrefix, 1, roomId)
        updateUserRoom(roomId)
        socket.join(roomId)
        io.to(roomId).emit('player joined', roomId)
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
        }
        const newRoomPlayers = [socket.userInfo.userId]
        const hmArgs = [roomsPrefix + roomId, 'info', JSON.stringify(newRoomInfo), 'players', JSON.stringify(newRoomPlayers)]
        await redisClient.HMSET(hmArgs)
        await redisClient.ZADD(roomsListPrefix, 1, roomId)
        await updateUserRoom(roomId)
        socket.join(roomId);
        io.to(roomId).emit('player joined', roomId)
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
        const currentPlayers = JSON.parse(roomCurrentInfo[1]).length
        const roomState = JSON.parse(roomCurrentInfo[0]).state
        if (currentPlayers >= gameMeta.roomMin && roomState !== 'started')
            gameStart(roomId, 'time over')
        else if (roomState !== 'started')
            destroyRoom(roomId)
    }

    const gameStart = async (roomId, reason) => {
        io.of('/').adapter.allRooms((err, rooms) => {
            logger.info(rooms); // an array containing all rooms (accross every node)
        });
        logger.info(roomId + ' started because ' + reason)
        io.to(roomId).emit('game started', roomId)
        const roomHash = await redisClient.HMGET(roomsPrefix + roomId, 'info')
        const roomHashParsed = JSON.parse(roomHash)
        roomHashParsed.state = 'started'
        await redisClient.HSET(roomsPrefix + roomId, 'info', JSON.stringify(roomHashParsed))
    }

    const destroyRoom = async (roomId) => {
        const roomplayers = await redisClient.hget(roomsPrefix + roomId, 'players')
        const roomplayersArray = JSON.parse(roomplayers)
        await asyncLoopRemovePlayersRoomInRedis(roomplayersArray, roomId)

        await redisClient.DEL(roomsPrefix + roomId)
        await redisClient.ZREM(roomsListPrefix, roomId)
        io.to(roomId).emit('room destroyed', roomId)


        io.of('/').in(roomId).clients((error, clients) => {
            if (error) logger.error(error)
            if (clients.length) {
                clients.forEach(client => io.of('/').adapter.remoteLeave(client, 'chat'));
            }
        })
        logger.info(roomId + ' destroyed ')
    }

    const asyncLoopRemovePlayersRoomInRedis = async (roomplayersArray, roomId) => {
        for (let i = 0; i < roomplayersArray.length; i++) {
            await updateUserRoom(roomId, roomplayersArray[i])
        }
    }

    const kickUserFromRoom = async () => {
        const userCurrentRoom = findUserCurrentRoom()
        if (userCurrentRoom) {
            setTimeout(async () => {
                await updateUserRoom(userCurrentRoom)
                // await redisClient.HMSET(roomsPrefix + roomId, 'info', JSON.stringify(roomInfo), 'players', JSON.stringify(currentPlayers))
                // await redisClient.ZINCRBY(roomsListPrefix, 1, roomId)
                // updateUserRoom(roomId)
                // socket.join(roomId)
                // io.to(roomId).emit('player joined', roomId)
            }, gameMeta.kickTime)
        }
    }

    return {
        findAvailableRooms: findAvailableRooms,
        kickUserFromRoom: kickUserFromRoom
    }
}