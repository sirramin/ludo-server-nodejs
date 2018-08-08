const _ = require('lodash')
module.exports = (roomId, players, methods) => {
    const numberOfplayers = players.length
    global.maxTime = 11
    let positions = []
    let marblesPosition = {}
    let orbs = {}
    let currentPlayer

    for (let i = 1; i <= numberOfplayers; i++) {
        orbs['player' + i] = 3
    }

    remainingTime[roomId] = maxTime
    diceAttempts[roomId] = 0


    const sendPositions = async () => {
        players.forEach((item, index) => {
            const playerNumber = (index + 1)
            positions.push({player: playerNumber, userId: players[index]})
            marblesPosition[playerNumber] = [0, 0, 0, 0]
        })
        await methods.setMultipleProps(...['positions', JSON.stringify(positions), 'marblesPosition', JSON.stringify(marblesPosition), 'orbs', JSON.stringify(orbs)])
        methods.sendGameEvents(101, 'positions', positions)
        firstTurn()
    }

    const firstTurn = async () => {
        const rand = Math.floor(Math.random() * numberOfplayers)
        const firstTurn = positions[rand].player
        currentPlayer = firstTurn
        await methods.setProp('currentPlayer', currentPlayer)
        //must be optimised
        const playeruserId = findUserId()
        await methods.sendEventToSpecificSocket(playeruserId, 201, 'yourTurn')
        await methods.sendEventToSpecificSocket(playeruserId, 202, 'yourPlayerNumber', rand + 1)
        methods.sendGameEvents(102, 'firstTurn', firstTurn)
        timerCounter()
        methods.sendGameEvents(103, 'timerStarted')
    }

    const timerCounter = () => {
        setInterval(async () => {
            remainingTime[roomId] -= 1
            if (remainingTime[roomId] === 0) {
                await getInitialProperties()
                if (orbs['player' + currentPlayer] === 1)
                    await methods.kickUser(findUserId())
                else {
                    changeTurn()
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
        remainingTime[roomId] = maxTime
        diceAttempts[roomId] = 0
        currentPlayer = await methods.getProp('currentPlayer')
        const previousPlayer = currentPlayer
        const nextPlayer = previousPlayer + 1 > numberOfplayers ? 1 : previousPlayer + 1
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
        const playeruserId = findUserId()
        methods.sendEventToSpecificSocket(playeruserId, 201, 'yourTurn')
        methods.sendEventToSpecificSocket(playeruserId, 202, 'yourPlayerNumber', nextPlayer)
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