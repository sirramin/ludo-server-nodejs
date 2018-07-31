module.exports = (roomId, players, methods) => {
    const numberOfplayers = players.length
    const maxTime = 10
    let positions = []
    let marblesPosition = {}
    let orbs = {player1: 3, player2: 3, player3: 3, player4: 3}
    let currentTurn
    let remainingTime = maxTime

    const sendPositions = async () => {
        players.forEach((item, index) => {
            const playerNumber = (index + 1)
            positions.push({player: playerNumber, userId: players[index]})
            marblesPosition['player' + playerNumber] = {marble1: 0, marble2: 0, marble3: 0, marble4: 0}
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
        methods.sendGameEvents(102, 'firstTurn', firstTurn)
        timerCounter()
        methods.sendGameEvents(103, 'timer started')
    }

    const timerCounter = () => {
        // const intervalId =
        setInterval(() => {
            remainingTime -= 10
            if (remainingTime === 0) {
                // clearInterval(intervalId)
                if (orbs['player' + currentTurn.player] === 1)
                    kickPlayer()
                else {
                    changeTurn(currentTurn.player, true, true)
                }
            }
        }, 10000)
    }

    const kickPlayer = () => {

    }

    const changeTurn = async (previousPlayer, decreaseOrb, timeEnds) => {
        remainingTime = maxTime
        const nextPlayer = previousPlayer + 1 > numberOfplayers ? 1 : previousPlayer + 1
        currentTurn.player = nextPlayer
        let propsArray = ['currentTurn' , JSON.stringify(currentTurn)]
        if (decreaseOrb) {
            orbs['player' + previousPlayer] -= 1
            propsArray.push('orbs', JSON.stringify(orbs))
        }
        await methods.setMultipleProps(...propsArray)
        logger.info('Turn changed to palyer' + nextPlayer)
        methods.sendGameEvents(104, 'changeTurn', {
            "player": nextPlayer,
            "decreaseOrb": decreaseOrb,
            "timeEnds": timeEnds
        })
    }


    return {
        sendPositions: sendPositions
    }
}