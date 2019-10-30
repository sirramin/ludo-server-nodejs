const _ = require('lodash')
module.exports = (io, userId, gameMeta, marketKey, roomId) => {
    const maxTime = 11,
        methods = require('../redisHelper/room')(io, gameMeta, roomId, marketKey)
    let roomInfo, positions, currentPlayer, thisPlayerNumber, thisPlayerIndex, marblesPosition, lights, hits

    const handleLeft = async () => {
        await getInitialProperties()
        await affectRoomInRedis()
        logger.info(' positions.length: ' + positions.length)
        await registerRecord()
        if (await isLeftPlayerTurn() && positions.length > 1) {
            logger.info('------changeTurn 1 -----------')
            await changeTurn()
        }
    }

    const affectRoomInRedis = async () => {
        positions.splice(thisPlayerIndex, 1)
        delete marblesPosition[thisPlayerNumber.toString()]
        delete lights['player' + thisPlayerNumber.toString()]
        await methods.setMultipleProps(['positions', JSON.stringify(positions), 'lights', JSON.stringify(lights), 'marblesPosition', JSON.stringify(marblesPosition)])
        methods.sendGameEvents(6, 'playerLeft', {
            player: thisPlayerNumber,
            positions: positions,
            marblesPosition: marblesPosition,
            lights: lights
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
        lights = JSON.parse(roomInfo['lights'])
        hits = JSON.parse(roomInfo['hits'])
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
        if (lights['player' + nextPlayer] > 0) {
            logger.info('------changeTurn  orb > 0 -----------')
            await methods.setProp('currentPlayer', nextPlayer)
            methods.sendGameEvents(104, 'changeTurn', {
                "player": nextPlayer,
                "decreaseOrb": false,
                "timeEnds": false,
                "lights": lights,
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

    const registerRecord = async () => {
        const lastRecord = await methods.getProp('record')
        const thisPlayerHit = hits[thisPlayerIndex]
        if (lastRecord && thisPlayerHit <= lastRecord)
            return
        else if(thisPlayerHit > 0)
            return await methods.setProp('record', thisPlayerHit)
    }

    return ({
        handleLeft: handleLeft
    })

}