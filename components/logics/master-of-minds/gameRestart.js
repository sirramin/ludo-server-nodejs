const _ = require('lodash')

const maxTime = 110
let positions = []
let marblesPosition = {}
let orbs = {}
let currentPlayer

module.exports.handler = async (roomId, methods) => {
    await sendCurrentTurn(methods)
    timerCounter(roomId, methods)
}

const findUserId = () => {
    const userObj = _.find(positions, function (o) {
        return o.player === currentPlayer
    })
    return userObj.userId
}

const changeTurn = async (methods) => {
    await methods.setProp('remainingTime', maxTime)
    await methods.setProp('diceAttempts', 0)
    currentPlayer = await methods.getProp('currentPlayer')
    const previousPlayer = currentPlayer
    const nextPlayer = previousPlayer + 1 > positions.length ? 1 : previousPlayer + 1
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

const getInitialProperties = async (methods) => {
    const roomInfo = await methods.getAllProps()
    positions = JSON.parse(roomInfo['positions'])
}


