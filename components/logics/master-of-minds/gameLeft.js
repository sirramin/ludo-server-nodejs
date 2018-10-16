const _ = require('lodash')
module.exports = (io, userId, gameMeta, marketKey, roomId) => {
    const methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
    let roomInfo, positions, thisPlayerNumber, thisPlayerIndex

    const handleLeft = async () => {
        await getInitialProperties()
        await notifyOtherUser()
        // affect to leaderboard
        await methods.setProp('gameEnds', true)
        await deletePlayersRoomAfterGame()
        await methods.deleteRoom(roomId)
    }

    const notifyOtherUser = async () => {
        methods.sendGameEvents(6, 'playerLeft', {
            player: thisPlayerNumber
        })
        methods.sendGameEvents(24, 'winner', {
            player: thisPlayerNumber === 1 ? 2 : 1
        })
    }

    const deletePlayersRoomAfterGame = async () => {
        await methods.deleteUserRoom(findUserId(1))
        await methods.deleteUserRoom(findUserId(2))
    }

    const findUserId = (playerNumber) => {
        const userObj = _.find(positions, function (o) {
            return o.player === playerNumber
        })
        return userObj.userId
    }

    const getInitialProperties = async () => {
        roomInfo = await methods.getAllProps()
        positions = JSON.parse(roomInfo['positions'])
        thisPlayerNumber = findThisPlayerNumber()
        thisPlayerIndex = thisPlayerNumber - 1
    }

    const findThisPlayerNumber = () => {
        const userObj = _.find(positions, function (o) {
            return o.userId === userId
        })
        return userObj.player
    }

    return ({
        handleLeft: handleLeft
    })

}