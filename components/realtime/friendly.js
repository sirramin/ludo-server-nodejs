const redisClient = require('../../common/redis-client'),
    uniqid = require('uniqid')

module.exports = (io, socket, gameMeta) => {
    const userId = socket.userInfo.userId,
        marketName = (socket.userInfo.market === 'mtn' || socket.userInfo.market === 'mci') ? socket.userInfo.market : 'market',
        marketKey = gameMeta.name + ':users:' + marketName,
        roomsListPrefix = gameMeta.name + ':rooms:roomsList',
        roomsPrefix = gameMeta.name + ':rooms:',
        userRoomPrefix = gameMeta.name + ':user_room:' + marketName

    const invite = async (...usernamesArray) => {
        if (usernamesArray.length > 3)
            socket.emit('friendly', {
                code: 1,
                event: 'inviteError',
                msg: 'you have invited more than 3 players'
            })
        usernamesArray.forEach((val, index) => {
            socket.emit('friendly', {
                code: 1,
                event: 'friendlyMatchRequest'
            })
        })
    }

    const findUserCurrentRoom = async () => {
        return await redisClient.hget(userRoomPrefix, userId)
    }

    const joinPlayerToRoom = async (roomId) => {
        const roomCurrentData = await redisClient.HMGET(roomsPrefix + roomId, 'info', 'players')
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
        await redisClient.HMSET(roomsPrefix + roomId, 'info', JSON.stringify(roomInfo), 'players', JSON.stringify(currentPlayers))
        await redisClient.ZINCRBY(roomsListPrefix, 1, roomId)
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
        await redisClient.HMSET(hmArgs)
        await redisClient.ZADD(roomsListPrefix, 1, roomId)
        await updateUserRoom(roomId)
        socket.join(roomId)
        sendMatchEvents(roomId, 3, 'playerJoined', {
            roomId: roomId
        })
        setTimeout(async () => {
            await roomWaitingTimeOver(roomId)
        }, gameMeta.waitingTime)
    }

    const updateUserRoom = async (roomId, anyUserId) => {
        const user_id = anyUserId ? anyUserId : userId
        return await redisClient.hset(userRoomPrefix, user_id, roomId)
    }

    const deleteUserRoom = async (userId) => {
        return await redisClient.HDEL(userRoomPrefix, userId)
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
        let roomPlayersWithNames = []
        for (let i = 0; i < roomPlayers.length; i++) {
            const playerNumber = (i + 1)
            const userData = await redisClient.HGET(marketKey, roomPlayers[i])
            roomPlayersWithNames.push({player: playerNumber, userId: roomPlayers[i], name: JSON.parse(userData).name})
        }
        roomHashParsed.state = 'started'
        await redisClient.HSET(roomsPrefix + roomId, 'info', JSON.stringify(roomHashParsed))

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
                            await redisClient.HSET(roomsPrefix + userCurrentRoom, 'players', JSON.stringify(currentPlayersParsed))
                            await redisClient.ZINCRBY(roomsListPrefix, -1, userCurrentRoom)
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
                await redisClient.HSET(roomsPrefix + userCurrentRoom, 'players', JSON.stringify(currentPlayersParsed))
                await redisClient.ZINCRBY(roomsListPrefix, -1, userCurrentRoom)
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
        const userData = await redisClient.HGET(marketKey, userId)
        const userDataParsed = JSON.parse(userData)
        const roomId = await findUserCurrentRoom()
        const oldSocketId = userDataParsed.socketId
        const newSocketId = socket.id
        userDataParsed.socketId = newSocketId
        userDataParsed.dc = false
        await redisClient.HSET(marketKey, userId, JSON.stringify(userDataParsed))
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