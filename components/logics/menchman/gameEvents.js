const _ = require('lodash')
module.exports = (io, socket, gameMeta, marketKey) => {
    userId = socket.userInfo.userId
    let matchMaking, roomId, methods, roomInfo, positions, marblesPosition, currentPlayer, orbs

    const getAct = (msg) => {
        const {act, data} = msg
        if (act === 'rollDice')
            rollDice()
        if (act === 'move')
            move(data.marbleNumber)
    }

    const rollDice = async () => {
        await getInitialProperties()
        remainingTime[roomId] = maxTime
        if (diceAttempts[roomId])
            diceAttempts[roomId] += 1
        else
            diceAttempts[roomId] = 1
        // const currentPlayer = await methods.getProp('currentPlayer')
        const tossNumber = Math.floor(Math.random() * 6) + 1
        methods.sendGameEvents(20, 'tossNumber', tossNumber)
        await checkRules(tossNumber, currentPlayer)
    }

    const getInitialProperties = async () => {
        matchMaking = require('../../realtime/matchMaking')(io, socket, gameMeta, marketKey)
        roomId = await matchMaking.findUserCurrentRoom()
        methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
        roomInfo = await methods.getAllProps()
        if (!marketKey) marketKey = JSON.parse(roomInfo['info']).marketKey
        marblesPosition = JSON.parse(roomInfo['marblesPosition'])
        positions = JSON.parse(roomInfo['positions'])
        currentPlayer = JSON.parse(roomInfo['currentTurn']).player
        orbs = JSON.parse(roomInfo['orbs'])
    }


    const checkRules = async (tossNumber, currentPlayer) => {
        if (playerHasMarbleOnRoad(currentPlayer)) {
            const marbs = whichMarblesCanMove(tossNumber, currentPlayer)
            if (marbs.length) {
                methods.sendGameEvents(21, 'marblesCanMove', marbs)
                await saveTossNumber(tossNumber)
            }
            else {
                methods.sendGameEvents(21, 'marblesCanMove', marbs)
                changeTurn()
            }
        }
        else /* All In Nest */ {
            if (tossNumber === 6) {
                remainingTime[roomId] = maxTime
                diceAttempts[roomId] = 0
                await saveTossNumber(tossNumber)
                methods.sendGameEvents(21, 'marblesCanMove', [1, 2, 3, 4])
            }
            else  /* tossNumber !== 6 */ {
                if (diceAttempts[roomId] === 3) {
                    changeTurn()
                }
                else methods.sendGameEvents(22, 'canRollDiceAgain', true)
            }
        }
    }

    const saveTossNumber = async (tossNumber) => {
        methods.setProp('tossNumber', tossNumber)
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
        currentPlayerMarbles.forEach((marblePosition, index) => {
            const currentMarbleNumber = index + 1
            const newPosition = positionCalculator(marblePosition, currentPlayer, tossNumber)

            if (!newPosition)
                marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])

            if (tossNumber !== 6 && marblePosition === 0)
                marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])

            // checking other marbles in their starting tile conflict
            if (tileStarts.indexOf(newPosition) !== -1) { // if this current player marble target meet one of the tileStarts
                const targetPlayerNumber = tileStarts.indexOf(newPosition)
                const targetPlayerNumberMarblePositions = marblePosition[targetPlayerNumber]
                if (targetPlayerNumberMarblePositions === tileStarts[targetPlayerNumber - 1])
                    marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])
            }

            currentPlayerMarbles.forEach((currentMarbleNumber2, marblePosition2) => {
                // player marble cant sit on same color
                // tossNumber === 6 && marblePosition === 0 &&
                if (newPosition === marblePosition2)
                    marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])

                //player has not enough space in its last tiles
                if (marblePosition !== 0 && newPosition >= tilesStartEndLast[currentPlayer - 1][2]) {
                    if (marblePosition2 >= tilesStartEndLast[currentPlayer - 1][2] && marblePosition2 <= tilesStartEndLast[currentPlayer - 1][3])
                        if (newPosition === marblePosition2)
                            marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])
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
                else if (marblePosition + tossNumber > tilesStartEndLast[currentPlayer - 1][1] && marblePosition < tilesStartEndLast[currentPlayer - 1][0])
                    newPosition = marblePosition + tossNumber - tilesStartEndLast[currentPlayer - 1][1] + tilesStartEndLast[currentPlayer - 1][2] - 1
                else
                    newPosition = marblePosition + tossNumber
            }
            if (currentPlayer === 1) {
                newPosition = marblePosition + tossNumber
            }
        }

        else if (marblePosition === 0 && tossNumber === 6)
            newPosition = tileStarts[currentPlayer - 1]

        return newPosition
    }

    const move = async (marbleNumber) => {
        await getInitialProperties()
        remainingTime[roomId] = maxTime
        // const roomData = await methods.getAllProps()
        const tossNumber = parseInt(roomInfo.tossNumber)
        // const currentPlayer = JSON.stringify(roomInfo.currentTurn).player
        // const marblesPosition = JSON.stringify(roomData)
        const marblePosition = marblesPosition[currentPlayer][marbleNumber - 1]
        const newPosition = positionCalculator(marblePosition, currentPlayer, tossNumber)
        let newMarblesPosition = JSON.parse(JSON.stringify(marblesPosition))
        newMarblesPosition[currentPlayer][marbleNumber - 1] = newPosition
        await methods.setProp('marblesPosition', JSON.stringify(newMarblesPosition))
        const marblesMeeting = checkMarblesMeeting(marblesPosition, newMarblesPosition, newPosition)
        if (marblesMeeting.meet)
            await hitPlayer(newPosition, newMarblesPosition, marblesMeeting, tossNumber)
        else {
            methods.sendGameEvents(23, 'marblesPosition', newMarblesPosition)
            if (tossNumber !== 6)
                changeTurn()
        }
    }

    const checkMarblesMeeting = (marblesPosition, newMarblesPosition, newPosition) => {
        for (let key in marblesPosition) {
            marblesPosition[key].forEach((val, index) => {
                if (val === newPosition)
                    return {
                        meet: true,
                        player: key,
                        marble: index
                    }
            })
        }
        return {
            meet: false
        }
    }

    const hitPlayer = async (newPosition, newMarblesPosition, marblesMeeting, tossNumber) => {
        newMarblesPosition[marblesMeeting.player][marblesMeeting.marble] = 0
        await methods.setProp('marblesPosition', JSON.stringify(newMarblesPosition))
        methods.sendGameEvents(23, 'marblesPosition', newMarblesPosition)
        if (tossNumber !== 6)
            changeTurn()
    }

    const findUserId = (nextPlayer) => {
        const userObj = _.find(positions, function (o) {
            return o.player === nextPlayer
        })
        return userObj.userId
    }

    const changeTurn = async () => {
        remainingTime[roomId] = maxTime
        diceAttempts[roomId] = 0
        const numberOfplayers = positions.length
        const nextPlayer = currentPlayer + 1 > numberOfplayers ? 1 : currentPlayer + 1
        await methods.setProp('currentTurn', JSON.stringify({'player': nextPlayer}))
        methods.sendGameEvents(104, 'changeTurn', {
            "player": nextPlayer,
            "decreaseOrb": false,
            "timeEnds": false,
            "orbs": orbs
        })
        const playeruserId = findUserId(nextPlayer)
        methods.sendEventToSpecificSocket(playeruserId, 201, 'yourTurn')
        methods.sendEventToSpecificSocket(playeruserId, 202, 'yourPlayerNumber', nextPlayer)
    }

    return ({
        // rollDice: rollDice,
        // move: move,
        getAct: getAct
    })

}