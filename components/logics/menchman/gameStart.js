const _ = require('lodash')
module.exports = (roomId, players, methods) => {
    const numberOfplayers = players.length
    global.maxTime = 11
    let positions = []
    let marblesPosition = {}
    let orbs = {}
    for (let i = 1; i <= numberOfplayers; i++) {
        orbs['player' + i] = 3
    }

    let currentTurn
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
        const firstTurn = {player: positions[rand].player}
        currentTurn = firstTurn
        await methods.setProp('currentTurn', JSON.stringify(currentTurn))
        const playeruserId = findUserId()
        await methods.sendEventToSpecificSocket(playeruserId, 201, 'yourTurn')
        await methods.sendEventToSpecificSocket(playeruserId, 202, 'yourPlayerNumber', rand + 1)
        methods.sendGameEvents(102, 'firstTurn', firstTurn)
        timerCounter()
        methods.sendGameEvents(103, 'timerStarted')
    }

    const timerCounter = () => {
        setInterval(() => {
            remainingTime[roomId] -= 1
            if (remainingTime[roomId] === 0) {
                logger.info('time ends')
                logger.info('remainingTime ' + JSON.stringify(remainingTime))
                if (orbs['player' + currentTurn.player] === 1)
                    methods.kickUser(findUserId())
                else {
                    changeTurn(currentTurn.player, true, true)
                }
            }
        }, 1000)
    }

    const findUserId = () => {
        const userObj = _.find(positions, function (o) {
            return o.player === currentTurn.player;
        })
        return userObj.userId
    }

    const changeTurn = async (previousPlayer, decreaseOrb, timeEnds) => {
        remainingTime[roomId] = maxTime
        diceAttempts[roomId] = 0
        const nextPlayer = previousPlayer + 1 > numberOfplayers ? 1 : previousPlayer + 1
        currentTurn.player = nextPlayer
        let propsArray = ['currentTurn', JSON.stringify(currentTurn)]
        if (decreaseOrb) {
            orbs['player' + previousPlayer] -= 1
            propsArray.push('orbs', JSON.stringify(orbs))
        }
        await methods.setMultipleProps(...propsArray)
        logger.info('Turn changed to palyer' + nextPlayer)
        methods.sendGameEvents(104, 'changeTurn', {
            "player": nextPlayer,
            "decreaseOrb": decreaseOrb,
            "timeEnds": timeEnds,
            "orbs": JSON.stringify(orbs)
        })
        const playeruserId = findUserId()
        methods.sendEventToSpecificSocket(playeruserId, 201, 'yourTurn')
        methods.sendEventToSpecificSocket(playeruserId, 202, 'yourPlayerNumber', nextPlayer)
    }

    return {
        sendPositions: sendPositions
    }
}