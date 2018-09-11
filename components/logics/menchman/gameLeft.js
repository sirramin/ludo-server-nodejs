const _ = require('lodash')
module.exports = (io, userId, gameMeta, marketKey, roomId) => {
    const maxTime = 11,
        methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
    let roomInfo, positions, currentPlayer, thisPlayerNumber, thisPlayerIndex, marblesPosition, orbs

    const handleLeft = async () => {
        await getInitialProperties()
        await affectRoomInRedis()
        logger.info(' positions.length: ' + positions.length)
        if (await isLeftPlayerTurn() && positions.length > 1) {
            logger.info('------changeTurn 1 -----------')
            await changeTurn()
        }
    }

    const affectRoomInRedis = async () => {
        positions.splice(thisPlayerIndex, 1)
        delete marblesPosition[thisPlayerNumber.toString()]
        delete orbs['player' + thisPlayerNumber.toString()]
        await methods.setMultipleProps(['positions', JSON.stringify(positions), 'orbs', JSON.stringify(orbs), 'marblesPosition', JSON.stringify(marblesPosition)])
        methods.sendGameEvents(6, 'playerLeft', {
            player: thisPlayerNumber,
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
        thisPlayerIndex = thisPlayerNumber - 1
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
        logger.info('------ max time -----')
        await methods.setProp('diceAttempts', 0)
        const numberOfPlayers = positions.length
        const nextPlayer = currentPlayer + 1 > numberOfPlayers ? 1 : currentPlayer + 1
        if (orbs['player' + nextPlayer] > 0) {
            logger.info('------changeTurn  orb > 0 -----------')
            await methods.setProp('currentPlayer', nextPlayer)
            methods.sendGameEvents(104, 'changeTurn', {
                "player": nextPlayer,
                "decreaseOrb": false,
                "timeEnds": false,
                "orbs": orbs,
                "kick": true
            })
            const playerUserId = findUserIdOfNextPlayer(nextPlayer)
            await methods.sendEventToSpecificSocket(playerUserId, 201, 'yourTurn', 1)
        }
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