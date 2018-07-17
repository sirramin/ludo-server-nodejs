const redisClient = require('../../common/redis-client'),
    uniqid = require('uniqid')

module.exports = (socket, gameMeta) => {
    const userId = socket.userInfo.userId,
        roomsListPrefix = gameMeta.name + ':rooms:roomsList',
        roomsPrefix = gameMeta.name + ':rooms:'

    const findAvailableRooms = async () => {
        try {
            const foundedRoom = await asyncLoop()
            if (!foundedRoom)
                createNewRoom()
            else
                joinPlayerToRoom(foundedRoom)
        }
        catch (e) {
            logger.log(e)
        }
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
        for (let i = 0; i <= availableRooms.length ; i++) {
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
        const currentPlayersLength =currentPlayers.length
        let newState
        if (currentPlayersLength === 4)
            socket.emit('message', 'Room is fll')

        currentPlayersLength === 3 ? newState = "started" : newState = "waiting"

        const roomInfo = {
            "roomId": roomId,
            "state": newState,
            "creationDateTime": JSON.parse(roomCurrentInfo[0]).creationDateTime
        }
        currentPlayers.push(userId)
        await redisClient.HMSET(roomsPrefix + roomId, 'info', JSON.stringify(roomInfo), 'players', JSON.stringify(currentPlayers))
        await redisClient.ZINCRBY(roomsListPrefix, 1, roomId)
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
        setTimeout(() => {
            roomWaitingTimeOver(roomId)
        }, gameMeta.waitingTime)
    }

    const roomWaitingTimeOver = async (roomId) => {
        const roomCurrentInfo = await redisClient.HMGET(roomsPrefix + roomId, 'info', 'players')
        const currentPlayers = JSON.parse(roomCurrentInfo[1]).length
        const roomState = JSON.parse(roomCurrentInfo[0]).state
        if (currentPlayers >= gameMeta.roomMin && roomState !== 'started')
            gameStart()
        else if (roomState !== 'started')
            DestroyRoom()
    }

    const gameStart = () => {

    }

    const DestroyRoom = () => {

    }


    return {
        findAvailableRooms: findAvailableRooms
    }
}