const redisClient = require('../../common/redis-client')

module.exports = (socket, gameMeta) => {
    const userId = socket.userInfo.userId,
        roomsListPrefix = roomsListPrefix,
    roomsPrefix = gameMeta.name + ':rooms:'

    const findAvailableRooms = async () => {
        try {
            let foundedRoom
            const asyncLoop = async (socket, gameMeta) => {
                for (let i = gameMeta.roomMax - 1; i >= gameMeta.roomMin; i--) {
                    const path = roomsListPrefix
                    const args = [path, i, i, 'LIMIT', 1, 1]
                    const availableRooms = await redisClient.ZRANGEBYSCORE(args)
                    if (availableRooms.length) {
                        availableRooms.forEach((room, index) => {
                            if (room.state === 'waiting') {
                                foundedRoom = room
                                break
                            }
                        })
                        await joinPlayerToRoom(socket, gameMeta, foundedRoom)
                    }
                }
            }
            await asyncLoop(socket, gameMeta)
            if (!foundedRoom)
                createNewRoom(socket, gameMeta)
        }
        catch (e) {
            console.log(e)
        }
    }

    const joinPlayerToRoom = async (socket, gameMeta, roomId) => {

        const newRoomInfo = {
            "roomId": roomId,
            "state": "waiting",
            "creationDateTime": currentTimeStamp
        }
        redisClient.SADD(roomId, userId)
        redisClient.ZADD(roomsListPrefix, JSON.stringify(newRoomInfo))
    }

    const createNewRoom = async (socket, gameMeta) => {
        const roomId = uuid()
        const currentTimeStamp = new Date().getTime()
        const newRoomInfo = {
            "roomId": roomId,
            "state": "waiting",
            "creationDateTime": currentTimeStamp,
        }
        const newRoomPlayers = [socket.userInfo.userId]
        const hmArgs = [roomsPrefix + roomId, 'info', JSON.stringify(newRoomInfo), 'players', JSON.stringify(newRoomPlayers)]
        redisClient.HMSET(hmArgs)
        redisClient.ZADD(roomsListPrefix, roomId)
        setTimeout(() => {
            roomWaitingTimeOver()
        }, 60)
    }

    const roomWaitingTimeOver = async () => {
        if (room.currentPlayers >= room.roomMin)
            gameStart()
        else
            DestroyRoom()
    }

    const gameStart = () => {

    }

    const DestroyRoom = () => {

    }
}