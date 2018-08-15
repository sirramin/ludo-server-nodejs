const _ = require('lodash')
module.exports = (io, socket, gameMeta, marketKey, roomId) => {
    const userId = socket.userInfo.userId,
        methods = require('../../realtime/methods')(io, gameMeta, marketKey, roomId)
    let roomInfo, positions, currentPlayer, players, thisPlayerNumber

    const handleLeft = async () => {
        await getInitialProperties()
        await affectRoomInRedis()
        if (await isLeftPlayerTurn()) {
            await changeTurn()
        }

    }

    const affectRoomInRedis = async () => {
        positions.splice(thisPlayerNumber, 1)
        //orbs
        //marblesPosition
        methods.setProp()
    }

    const isLeftPlayerTurn = async () => {
        const currentPlayerUserId = findUserId()
        return currentPlayerUserId === userId

    }

    const getInitialProperties = async () => {
        roomInfo = await methods.getAllProps()
        players = JSON.parse(roomInfo['players'])
        thisPlayerNumber = players.indexOf(userId) + 1
        currentPlayer = parseInt(roomInfo['currentPlayer'])
        positions = JSON.parse(roomInfo['positions'])
    }

    const findUserId = () => {
        const userObj = _.find(positions, function (o) {
            return o.player === currentPlayer
        })
        return userObj.userId
    }

    const changeTurn = async () => {
        await methods.setProp('remainingTime', maxTime)
        await methods.setProp('diceAttempts', 0)
        const numberOfplayers = positions.length
        const nextPlayer = currentPlayer + 1 > numberOfplayers ? 1 : currentPlayer + 1
        await methods.setProp('currentPlayer', nextPlayer)
        methods.sendGameEvents(104, 'changeTurn', {
            "player": nextPlayer,
            "decreaseOrb": false,
            "timeEnds": false,
            "orbs": orbs
        })
        const playeruserId = findUserId(nextPlayer)
        methods.sendEventToSpecificSocket(playeruserId, 201, 'yourTurn')
        // methods.sendEventToSpecificSocket(playeruserId, 202, 'yourPlayerNumber', nextPlayer)
    }

    return ({
        handleLeft: handleLeft
    })

}