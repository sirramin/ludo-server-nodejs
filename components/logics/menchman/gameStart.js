const _ = require('lodash')
module.exports = (roomId, players, roomPlayersWithNames, methods) => {
    const numberOfplayers = players.length
    const maxTime = 11
    let positions = []
    let marblesPosition = {}
    let orbs = {}
    let currentPlayer
    let hits = []
    let beats = []

    for (let i = 1; i <= numberOfplayers; i++) {
        orbs['player' + i] = 3
        hits[i-1] = 0
        beats[i-1] = 0
    }

    const sendPositions = async () => {
        await methods.setProp('remainingTime', maxTime)
        await methods.setProp('diceAttempts', 0)
        players.forEach((item, index) => {
            const playerNumber = (index + 1)
            // positions.push({player: playerNumber, userId: item.userId, name: item.name})
            marblesPosition[playerNumber] = [0, 0, 0, 0]
            methods.sendEventToSpecificSocket(item, 202, 'yourPlayerNumber', playerNumber)
        })
        positions = roomPlayersWithNames
        await methods.setMultipleProps(...['positions', JSON.stringify(positions), 'marblesPosition', JSON.stringify(marblesPosition), 'orbs', JSON.stringify(orbs), 'hits', JSON.stringify(hits), 'beats', JSON.stringify(beats)])
        methods.sendGameEvents(101, 'positions', positions)
        await firstTurn()
    }

    const firstTurn = async () => {
        const rand = Math.floor(Math.random() * numberOfplayers)
        const firstTurn = positions[rand].player
        currentPlayer = firstTurn
        await methods.setProp('currentPlayer', currentPlayer)
        //must be optimised
        const playerUserId = findUserId()
        await methods.sendEventToSpecificSocket(playerUserId, 201, 'yourTurn', 1)
        // await methods.sendEventToSpecificSocket(playerUserId, 202, 'yourPlayerNumber', rand + 1)
        methods.sendGameEvents(102, 'firstTurn', firstTurn)
        timerCounter()
        methods.sendGameEvents(103, 'timerStarted')
    }

    const timerCounter = () => {
        const timerInterval = setInterval(async () => {
            const remainingTime = await methods.incrProp('remainingTime', -1)
            if (remainingTime < -1 || positions.length === 1) {
                clearInterval(timerInterval)
                methods.deleteRoom(roomId)
            }
            // logger.info('roomId: '+ roomId + ' remainingTime: ' + remainingTime)
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
        sendPositions: sendPositions
    }
}