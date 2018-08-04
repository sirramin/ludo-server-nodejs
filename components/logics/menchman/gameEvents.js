const _ = require('lodash')
module.exports = (io, socket, gameMeta) => {
    const maxTime = 10,
        userId = socket.userInfo.userId,
        matchMaking = require('../../realtime/matchMaking')(io, socket, gameMeta),
        roomId = matchMaking.findUserCurrentRoom(),
        methods = require('../../realtime/methods')(io, socket, gameMeta, roomId),
        roomInfo = methods.setMultipleProps(...['currentTurn', 'orbs', 'marblesPosition', 'players', 'positions']),
        marblesPosition = roomInfo['marblesPosition']

    const getAct = (act) => {
        if (act === 'rollDice')
            rollDice()
        if (act === 'move')
            move()
    }

    let diceAttempts = 0

    const rollDice = async () => {
        remainingTime[roomId] = maxTime
        const currentPlayer = await methods.getProp('currentPlayer')
        diceAttempts = +1
        const tossNumber = Math.floor(Math.random() * 6) + 1
        logger.info('tossNumber: ' + tossNumber)
        methods.sendGameEvents(20, 'tossNumber', 6)
        await checkRules(tossNumber, currentPlayer)
    }


    const checkRules = async (tossNumber, currentPlayer) => {
        if (playerHasMarbleOnRoad(currentPlayer)) {
            const marbs = whichMarblesCanMove(tossNumber, currentPlayer)
            _.intersection(marblesCantMove, marbs)
        }
        else /* All In Nest */ {
            if (tossNumber === 6) {
                remainingTime[roomId] = maxTime
                methods.sendGameEvents(21, 'marblesCanMove', [1, 2, 3, 4])
            }
            else  /* tossNumber !== 6 */ {
                if (diceAttempts === 3) changeTurn()
                else methods.sendGameEvents(22, 'canRollDiceAgain', true)
            }
        }
    }


    const playerHasMarbleOnRoad = (currentPlayer) => {
        const currentPlayerMarbles = marblesPosition[currentPlayer]
        for (let key in currentPlayerMarbles) {
            if (currentPlayerMarbles.hasOwnProperty(key) && currentPlayerMarbles[key] > 0)
                return true
        }
        return false
    }

    const tileStarts = [1, 11, 21, 31]
    const tilesStartEndLast = [[1, 40, 41, 44], [11, 10, 45, 48], [21, 20, 49, 52], [31, 30, 53, 56]]

    const whichMarblesCanMove = (tossNumber, currentPlayer) => {
        let marblesCantMove = []
        const currentPlayerMarbles = marblesPosition[currentPlayer]
        currentPlayerMarbles.forEach((index, marblePosition) => {
            const currentMarbleNumber = index + 1
            const newPosition = positionCalculator(marblePosition, currentPlayer, tossNumber)

            if (!newPosition)
                _.intersection(marblesCantMove, currentMarbleNumber)

            // checking other marbles in their starting tile conflict
            if (tileStarts.indexOf(newPosition) !== -1) { // if this current player marble target meet one of the tileStarts
                const targetPlayerNumber = tileStarts.indexOf(newPosition)
                const targetPlayerNumberMarblePositions = marblePosition[targetPlayerNumber]
                if (targetPlayerNumberMarblePositions === tileStarts[targetPlayerNumber])
                    _.intersection(marblesCantMove, currentMarbleNumber)
            }

            currentPlayerMarbles.forEach((currentMarbleNumber, marblePosition2) => {
                // player marble cant sit on same color
                if (tossNumber === 6 && marblePosition === 0 && newPosition === marblePosition2)
                    _.intersection(marblesCantMove, currentMarbleNumber)

                //player has not enough space in its last tiles
                if (marblePosition !== 0 && newPosition >= tilesStartEndLast[currentPlayer - 1][2]) {
                    if (marblePosition2 >= tilesStartEndLast[currentPlayer - 1][2] && marblePosition2 <= tilesStartEndLast[currentPlayer - 1][3])
                        if (newPosition === marblePosition2)
                            _.intersection(marblesCantMove, currentMarbleNumber)
                }
            })
        })

        return _.difference([1, 2, 3, 4], marblesCantMove)
    }

    const positionCalculator = (marblePosition, currentPlayer, tossNumber) => {
        let newPosition

        if (marblePosition + tossNumber > tilesStartEndLast[currentPlayer - 1][3])
            return false

        if (marblePosition !== 0) {
            if (currentPlayer !== 1) {
                if (marblePosition + tossNumber > 40)
                    newPosition = marblePosition + tossNumber - 40
                else if (marblePosition + tossNumber > tilesStartEndLast[currentPlayer - 1][1])
                    newPosition = marblePosition + tossNumber - tilesStartEndLast[currentPlayer - 1][1] + tilesStartEndLast[currentPlayer - 1][2] - 1
            }
            if (currentPlayer === 1) {
                newPosition = marblePosition + tossNumber
            }
        }

        else if (marblePosition === 0 && tossNumber === 6)
            newPosition = tileStarts[currentPlayer]

        return newPosition
    }

    const hasMarbleOnStartTile = (currentPlayer) => {
        marblesPosition[currentPlayer].forEach(marbleNumber, marblePosition => {

        })
        return false
    }

    const hitPlayer = () => {

    }

    const move = () => {
        remainingTime[roomId] = maxTime

    }

    const changeTurn = () => {
        remainingTime[roomId] = maxTime
        diceAttempts = 0
        const numberOfplayers = players.length
        const nextPlayer = previousPlayer + 1 > numberOfplayers ? 1 : previousPlayer + 1
        game.sendServerMessage('changeTurn', {
            "player": nextPlayer,
            "decreaseOrb": false,
            "timeEnds": false
        }, {
            success: () => {
                logger.info('Turn changed to palyer' + nextPlayer)
            },
            error: function (error) {
                logger.info(error);
            }
        })
    }

    return ({
        // rollDice: rollDice,
        // move: move,
        getAct: getAct
    })

}