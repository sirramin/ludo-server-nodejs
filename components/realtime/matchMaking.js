const
    redisClient = require('../../common/redis-client'),
    uniqid = require('uniqid')

module.exports = (io, socket, gameMeta) => {
    const
        userId = socket.userInfo.userId,
        marketName = (socket.userInfo.market === 'mtn' || socket.userInfo.market === 'mci') ? socket.userInfo.market : 'market',
        marketKey = gameMeta.name + ':users:' + marketName,
        roomsListPrefix = gameMeta.name + ':rooms:roomsList',
        roomsPrefix = gameMeta.name + ':rooms:',
        userRoomPrefix = gameMeta.name + ':user_room:' + marketName

    const findAvailableRooms = async (leagueId) => {
        leagueId = leagueId ? leagueId : 1
        try {
            const isPlayerJoinedBefore = await findUserCurrentRoom()
            if (isPlayerJoinedBefore) {
                socket.emit('matchEvent', {
                    code: 1,
                    event: 'playerAlreadyJoined'
                })
                return
            }
            const foundedRoom = await asyncLoop(null, leagueId)
            if (!foundedRoom)
                await createNewRoom(leagueId)
            else
                await joinPlayerToRoom(foundedRoom, leagueId)
        }
        catch (e) {
            logger.error(e.message)
        }
    }

    const findUserCurrentRoom = async () => {
        return await redisClient.hget(userRoomPrefix, userId)
    }

    const asyncLoop = async (i, leagueId) => {
        i = i || gameMeta.roomMax - 1
        for (i; i >= 1; i--) {
            const args = [roomsListPrefix, i, i]
            const availableRooms = await redisClient.zrangebyscore(args)
            if (availableRooms.length) {
                return await asyncForeach(availableRooms, i, leagueId)
            }
        }
        return false
    }

    const asyncForeach = async (availableRooms, i, leagueId) => {
        for (let j = 1; j <= availableRooms.length; j++) {
            const roomCurrentInfo = await redisClient.hget(roomsPrefix + availableRooms[j - 1], 'info')
            const roomCurrentInfoParsed = JSON.parse(roomCurrentInfo)
            if (roomCurrentInfoParsed && roomCurrentInfoParsed.state === 'waiting' && roomCurrentInfoParsed.leagueId === leagueId) {
                return roomCurrentInfoParsed.roomId
            }
        }
        if (i > 1)
            return await asyncLoop(i - 1, leagueId)
        return false
    }

    const joinPlayerToRoom = async (roomId) => {
        const roomCurrentData = await redisClient.hmget(roomsPrefix + roomId, 'info', 'players')
        let currentPlayers = JSON.parse(roomCurrentData[1])
        let roomInfo = JSON.parse(roomCurrentData[0])
        const currentPlayersLength = currentPlayers.length
        let newState
        if (currentPlayersLength === gameMeta.roomMax)
            socket.emit('matchEvent', {
                code: 2,
                event: 'roomIsFull'
            })
        currentPlayersLength === gameMeta.roomMax - 1 ? newState = "started" : newState = "waiting"
        roomInfo.state = newState
        currentPlayers.push(userId)
        await redisClient.hmset(roomsPrefix + roomId, 'info', JSON.stringify(roomInfo), 'players', JSON.stringify(currentPlayers))
        await redisClient.zincrby(roomsListPrefix, 1, roomId)
        await updateUserRoom(roomId)
        io.of('/').adapter.remoteJoin(socket.id, roomId, (err) => {
        })

        sendMatchEvents(roomId, 3, 'playerJoined', {
            roomId: roomId
        })
        if (newState === "started")
            gameStart(roomId, 'room fulled')
    }

    const createNewRoom = async (leagueId) => {
        const roomId = uniqid()
        const currentTimeStamp = new Date().getTime()
        const newRoomInfo = {
            "roomId": roomId,
            "state": "waiting",
            "creationDateTime": currentTimeStamp,
            "marketKey": marketKey,
            "leagueId": leagueId
        }
        const newRoomPlayers = [socket.userInfo.userId]
        const hmArgs = [roomsPrefix + roomId, 'info', JSON.stringify(newRoomInfo), 'players', JSON.stringify(newRoomPlayers)]
        await redisClient.hmset(hmArgs)
        await redisClient.zadd(roomsListPrefix, 1, roomId)
        await updateUserRoom(roomId)
        socket.join(roomId)
        sendMatchEvents(roomId, 3, 'playerJoined', {
            roomId: roomId
        })
        setTimeout(async () => {
            await roomWaitingTimeOver(roomId)
        }, gameMeta.waitingTime)
    }

    // const updateUserRoom_old = async (roomId, anyUserId) => {
    //     const user_id = anyUserId ? anyUserId : userId
    //     const userData = await redisClient.hget(marketKey, user_id)
    //     const userDataParsed = JSON.parse(userData)
    //     if (!userDataParsed.roomId)
    //         userDataParsed.roomId = roomId
    //     else
    //         delete userDataParsed.roomId
    //     await redisClient.hset(marketKey, userDataParsed.userId, JSON.stringify(userDataParsed))
    // }

    const updateUserRoom = async (roomId, anyUserId) => {
        const user_id = anyUserId ? anyUserId : userId
        return await redisClient.hset(userRoomPrefix, user_id, roomId)
    }

    const deleteUserRoom = async (userId) => {
        return await redisClient.hdel(userRoomPrefix, userId)
    }

    const roomWaitingTimeOver = async (roomId) => {
        const roomCurrentInfo = await redisClient.hmget(roomsPrefix + roomId, 'info', 'players')
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
        const roomHash = await redisClient.hmget(roomsPrefix + roomId, 'info', 'players')
        const roomHashParsed = JSON.parse(roomHash[0])
        const roomPlayers = JSON.parse(roomHash[1])
        let roomPlayersWithNames = []
        for (let i = 0; i < roomPlayers.length; i++) {
            const playerNumber = (i + 1)
            const userData = await redisClient.hget(marketKey, roomPlayers[i])
            roomPlayersWithNames.push({player: playerNumber, userId: roomPlayers[i], name: JSON.parse(userData).name})
        }
        roomHashParsed.state = 'started'
        await redisClient.hset(roomsPrefix + roomId, 'info', JSON.stringify(roomHashParsed))

        const methods = require('./methods')(io, gameMeta, roomId, marketKey)
        const logicStart = require('../logics/' + gameMeta.name + '/gameStart')(roomId, roomPlayers, roomPlayersWithNames, methods)
        await logicStart.sendPositions()
        // const webHookCaller = require('./webHookCaller')(gameMeta, roomId, roomPlayers, roomPlayersWithNames, marketKey)
        // return await webHookCaller.start()
    }

    const destroyRoom = async (roomId) => {
        const roomplayers = await redisClient.hget(roomsPrefix + roomId, 'players')
        const roomPlayersArray = JSON.parse(roomplayers)
        await asyncLoopRemovePlayersRoomInRedis(roomPlayersArray, roomId)

        await redisClient.del(roomsPrefix + roomId)
        await redisClient.zrem(roomsListPrefix, roomId)
        sendMatchEvents(roomId, 5, 'roomDestroyed', {
            roomId: roomId
        })
        io.of('/').in(roomId).clients((error, clients) => {
            if (error) logger.error(error)
            if (clients.length) {
                clients.forEach(client => io.of('/').adapter.remoteLeave(client, roomId));
            }
        })
        logger.info(roomId + ' destroyed')
    }

    const asyncLoopRemovePlayersRoomInRedis = async (roomPlayersArray, roomId) => {
        for (let i = 0; i < roomPlayersArray.length; i++) {
            await deleteUserRoom(roomPlayersArray[i])
            // await updateUserRoom('', roomPlayersArray[i])
        }
    }

    const kickUserFromRoomByDC = async () => {
        await removeUserSocketIdFromRedis()
        await addDisconnectStatusToUser()
        const userCurrentRoom = await findUserCurrentRoom()
        if (userCurrentRoom) {
            setTimeout(async () => {
                const userDataParsed = await getUserData()
                if (userDataParsed && userDataParsed.hasOwnProperty('dc') && userDataParsed.dc) {
                    const roomData = await redisClient.hmget(roomsPrefix + userCurrentRoom, 'players', 'info')
                    if (roomData[0]) {
                        const currentPlayersParsed = JSON.parse(roomData[0])
                        const roomState = JSON.parse(roomData[1]).state
                        if (currentPlayersParsed && currentPlayersParsed.length === 1 && roomState === 'waiting') {
                            await destroyRoom(userCurrentRoom)
                        }
                        else if (currentPlayersParsed && currentPlayersParsed.length > 1) {
                            await deleteUserRoom(userId)
                            currentPlayersParsed.splice(currentPlayersParsed.indexOf(userId), 1)
                            await redisClient.hset(roomsPrefix + userCurrentRoom, 'players', JSON.stringify(currentPlayersParsed))
                            await redisClient.zincrby(roomsListPrefix, -1, userCurrentRoom)
                            io.of('/').adapter.remoteDisconnect(socket.id, true, async (err) => {
                                logger.info('---------- remoteDisconnect-------------------')
                                const gameLeft = require('../logics/' + gameMeta.name + '/gameLeft')(io, userId, gameMeta, marketKey, userCurrentRoom)
                                await gameLeft.handleLeft()
                                const methods = require('./methods')(io, gameMeta, userCurrentRoom, marketKey)
                                await methods.addToLeaderboard(userId, false)
                                if (currentPlayersParsed.length === 1) {
                                    await methods.makeRemainingPlayerWinner(userCurrentRoom)
                                }
                            })
                        }
                    }
                }
            }, gameMeta.kickTime)
        }
    }

    const leftRoom = async () => {
        await removeUserSocketIdFromRedis()
        await addDisconnectStatusToUser()
        const userCurrentRoom = await findUserCurrentRoom()
        if (userCurrentRoom) {
            const roomData = await redisClient.hmget(roomsPrefix + userCurrentRoom, 'players', 'info')
            const currentPlayersParsed = JSON.parse(roomData[0])
            const roomState = JSON.parse(roomData[1]).state
            if (currentPlayersParsed && currentPlayersParsed.length === 1 && roomState === 'waiting') {
                await destroyRoom(userCurrentRoom)
            }
            else if (currentPlayersParsed && currentPlayersParsed.length > 1) {
                await deleteUserRoom(userId)
                currentPlayersParsed.splice(currentPlayersParsed.indexOf(userId), 1)
                await redisClient.hset(roomsPrefix + userCurrentRoom, 'players', JSON.stringify(currentPlayersParsed))
                await redisClient.zincrby(roomsListPrefix, -1, userCurrentRoom)
                io.of('/').adapter.remoteDisconnect(socket.id, true, async (err) => {
                    logger.info('---------- remoteDisconnect-------------------')
                    const gameLeft = require('../logics/' + gameMeta.name + '/gameLeft')(io, userId, gameMeta, marketKey, userCurrentRoom)
                    await gameLeft.handleLeft()
                    const methods = require('./methods')(io, gameMeta, userCurrentRoom, marketKey)
                    await methods.addToLeaderboard(userId, false)
                    if (currentPlayersParsed.length === 1) {
                        await methods.makeRemainingPlayerWinner(userCurrentRoom)
                    }
                })
            }
        }
    }

    const getUserData = async () => {
        const userData = await redisClient.hget(marketKey, userId)
        return JSON.parse(userData)
    }

    const setUserData = async (userDataParsed) => {
        await redisClient.hset(marketKey, userId, JSON.stringify(userDataParsed))
    }

    const removeUserSocketIdFromRedis = async () => {
        const userDataParsed = await getUserData()
        if (userDataParsed)
            delete userDataParsed['socketId']
        await setUserData(userDataParsed)
    }

    const addDisconnectStatusToUser = async () => {
        const userDataParsed = await getUserData()
        if (userDataParsed)
            userDataParsed['dc'] = true
        await setUserData(userDataParsed)
    }

    const sendMatchEvents = (roomId, code, event, data) => {
        io.to(roomId).emit('matchEvent', {
            code: code,
            event: event,
            data: data
        })
    }

    const changeSocketIdAndSocketRoom = async () => {
        const userData = await redisClient.hget(marketKey, userId)
        const userDataParsed = JSON.parse(userData)
        const roomId = await findUserCurrentRoom()
        const oldSocketId = userDataParsed.socketId
        const newSocketId = socket.id
        userDataParsed.socketId = newSocketId
        userDataParsed.dc = false
        await redisClient.hset(marketKey, userId, JSON.stringify(userDataParsed))
        io.of('/').adapter.remoteLeave(oldSocketId, roomId, (err) => {
            if (err)
                logger.info('err leaving socket' + userId)
            io.of('/').adapter.remoteJoin(newSocketId, roomId, (err) => {
                if (err)
                    logger.info('err joining socket' + userId)
                logger.info('user: ' + userId + ' with socket id: ' + newSocketId + ' joined again to room: ' + roomId)
            })
        })
    }

    return {
        findAvailableRooms: findAvailableRooms,
        kickUserFromRoomByDC: kickUserFromRoomByDC,
        findUserCurrentRoom: findUserCurrentRoom,
        changeSocketIdAndSocketRoom: changeSocketIdAndSocketRoom,
        leftRoom: leftRoom
    }
}