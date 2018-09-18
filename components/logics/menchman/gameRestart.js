const _ = require('lodash')
module.exports = (roomId, players, roomPlayersWithNames, methods) => {

    const timerCounter = () => {
        const timerInterval = setInterval(async () => {
            const remainingTime = await methods.incrProp('remainingTime', -1)
            if (remainingTime < -1 || positions.length === 1) {
                clearInterval(timerInterval)
                methods.deleteRoom(roomId)
            }
            logger.info('restart timer:::  roomId: '+ roomId + ' remainingTime: ' + remainingTime)
            if (remainingTime === 0) {
                await getInitialProperties()
                // if (positions.length === 1) clearInterval(timerInterval)
                if (orbs['player' + currentPlayer] === 1 && positions.length > 1)
                    await methods.kickUser(findUserId())
                else if (positions.length > 1) {
                    await changeTurn()
                }
            }
        }, 1000)
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
        currentPlayer = await methods.getProp('currentPlayer')
        const previousPlayer = currentPlayer
        const nextPlayer = previousPlayer + 1 > numberOfplayers ? 1 : previousPlayer + 1
        if (orbs['player' + nextPlayer] > 0) {
            currentPlayer = nextPlayer
            let propsArray = ['currentPlayer', currentPlayer]
            orbs['player' + previousPlayer] -= 1
            propsArray.push('orbs', JSON.stringify(orbs))
            await methods.setMultipleProps(...propsArray)
            methods.sendGameEvents(104, 'changeTurn', {
                "player": nextPlayer,
                "decreaseOrb": true,
                "timeEnds": true,
                "orbs": orbs
            })
            const playerUserId = findUserId()
            await methods.sendEventToSpecificSocket(playerUserId, 201, 'yourTurn', 1)
        }
    }

    const getInitialProperties = async () => {
        const roomInfo = await methods.getAllProps()
        // marblesPosition = JSON.parse(roomInfo['marblesPosition'])
        positions = JSON.parse(roomInfo['positions'])
        currentPlayer = parseInt(roomInfo['currentPlayer'])
        orbs = JSON.parse(roomInfo['orbs'])
    }

    return {
        timerCounter: timerCounter
    }
}