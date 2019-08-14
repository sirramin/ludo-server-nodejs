const _ = require('lodash')

const maxTime = 11
let positions = []
let marblesPosition = {}
let orbs = {}
let currentPlayer

module.exports.handler = async (roomId, methods) => {
    await sendCurrentTurn(methods)
    timerCounter(roomId, methods)
}

const sendCurrentTurn = async (methods) => {
    await getInitialProperties(methods)
    await methods.sendEventToSpecificSocket(findUserId(), 201, 'yourTurnAfterRestart', 1)
}

const timerCounter = (roomId, methods) => {
    const timerInterval = setInterval(async () => {
        const remainingTime = await methods.incrProp('remainingTime', -1)
        if (remainingTime < -1 || positions.length === 1) {
            clearInterval(timerInterval)
            methods.deleteRoom(roomId)
        }
        // logger.info('restart timer:::  roomId: ' + roomId + ' remainingTime: ' + remainingTime)
        if (remainingTime === 0) {
            await getInitialProperties(methods)
            if (orbs['player' + currentPlayer] === 1 && positions.length > 1)
                await methods.kickUser(findUserId())
            else if (positions.length > 1) {
                await changeTurn(methods)
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
    // marblesPosition = JSON.parse(roomInfo['marblesPosition'])
    positions = JSON.parse(roomInfo['positions'])
    currentPlayer = parseInt(roomInfo['currentPlayer'])
    orbs = JSON.parse(roomInfo['orbs'])
}


