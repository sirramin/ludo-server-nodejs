const _ = require('lodash')
module.exports = (io, socket, gameMeta, marketKey, roomId) => {
    const maxTime = 5,
        userId = socket.userInfo.userId,
        methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
    let roomInfo, positions, currentPlayer, thisPlayerNumber, thisPlayerIndex, marblesPosition, orbs

    const handleLeft = async () => {
        await getInitialProperties()
        await affectRoomInRedis()
        if (await isLeftPlayerTurn() && positions.length > 2) {
            await changeTurn()
        }
    }

    const affectRoomInRedis = async () => {
        positions.splice(thisPlayerIndex, 1)
        delete marblesPosition[thisPlayerNumber.toString()]
        delete orbs['player' + thisPlayerNumber.toString()]
        await methods.setMultipleProps(['positions', JSON.stringify(positions), 'orbs', JSON.stringify(orbs), 'marblesPosition', JSON.stringify(marblesPosition)])
        methods.sendGameEvents(6, 'playerLeft', {
            userId: userId,
            positions: positions,
            marblesPosition: marblesPosition,
            orbs: orbs
        })
    }

    const isLeftPlayerTurn = async () => {
        return thisPlayerNumber === currentPlayer
    }

    const getInitialProperties = async () => {
        roomInfo = await methods.getAllProps()
        positions = JSON.parse(roomInfo['positions'])
        currentPlayer = parseInt(roomInfo['currentPlayer'])
        thisPlayerNumber = findThisPlayerNumber()
        thisPlayerIndex = thisPlayerNumber -1
        marblesPosition = JSON.parse(roomInfo['marblesPosition'])
        orbs = JSON.parse(roomInfo['orbs'])
    }

    const findThisPlayerNumber = () => {
        const userObj = _.find(positions, function (o) {
            return o.userId === userId
        })
        return userObj.player
    }

    const changeTurn = async () => {
        await methods.setProp('remainingTime', maxTime)
        await methods.setProp('diceAttempts', 0)
        const numberOfPlayers = positions.length
        const nextPlayer = currentPlayer + 1 > numberOfPlayers ? 1 : currentPlayer + 1
        await methods.setProp('currentPlayer', nextPlayer)
        methods.sendGameEvents(104, 'changeTurn', {
            "player": nextPlayer,
            "decreaseOrb": false,
            "timeEnds": false,
            "orbs": orbs
        })
        const playerUserId = findUserIdOfNextPlayer(nextPlayer)
        await methods.sendEventToSpecificSocket(playerUserId, 201, 'yourTurn')
        // methods.sendEventToSpecificSocket(playerUserId, 202, 'yourPlayerNumber', nextPlayer)
    }

    const findUserIdOfNextPlayer = (nextPlayer) => {
        const userObj = _.find(positions, function (o) {
            return o.player === nextPlayer
        })
        return userObj.userId
    }

    return ({
        handleLeft: handleLeft
    })

}