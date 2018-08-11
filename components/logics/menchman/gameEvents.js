const _ = require('lodash')
module.exports = (io, socket, gameMeta, marketKey) => {
    const maxTime = 11
    userId = socket.userInfo.userId
    let matchMaking, roomId, methods, roomInfo, positions, marblesPosition, currentPlayer, orbs, currentPlayerMarbles, diceAttempts, remainingTime

    const getAct = (msg) => {
        const {act, data} = msg
        if (act === 'rollDice')
            rollDice()
        if (act === 'move')
            move(data.marbleNumber)
    }

    const rollDice = async () => {
        await getInitialProperties()
        await methods.setProp('remainingTime', maxTime)
        if (diceAttempts)
            diceAttempts = await methods.incrProp('diceAttempts', 1)
        else
             diceAttempts = await methods.setProp('diceAttempts', 1)
        const tossNumber = Math.floor(Math.random() * 6) + 1
        methods.sendGameEvents(20, 'tossNumber', tossNumber)
        await checkRules(tossNumber)
    }

    const getInitialProperties = async () => {
        //must be optimised and remove matchmaking
        matchMaking = require('../../realtime/matchMaking')(io, socket, gameMeta, marketKey)
        roomId = await matchMaking.findUserCurrentRoom()
        methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
        roomInfo = await methods.getAllProps()
        if (!marketKey) marketKey = JSON.parse(roomInfo['info']).marketKey
        currentPlayer = parseInt(roomInfo['currentPlayer'])
        diceAttempts = parseInt(roomInfo['diceAttempts'])
        remainingTime = parseInt(roomInfo['remainingTime'])
        marblesPosition = JSON.parse(roomInfo['marblesPosition'])
        currentPlayerMarbles = marblesPosition[currentPlayer.toString()]
        positions = JSON.parse(roomInfo['positions'])
        orbs = JSON.parse(roomInfo['orbs'])

    }


    const checkRules = async (tossNumber) => {
        if (playerHasMarbleOnRoad()) {
            const marbs = whichMarblesCanMove(tossNumber)
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
                await methods.setProp('remainingTime', maxTime)
                await methods.setProp('diceAttempts', 0)
                await saveTossNumber(tossNumber)
                methods.sendGameEvents(21, 'marblesCanMove', [1, 2, 3, 4])
            }
            else  /* tossNumber !== 6 */ {
                if (diceAttempts === 3) {
                    changeTurn()
                }
                else methods.sendGameEvents(22, 'canRollDiceAgain', true)
            }
        }
    }

    const saveTossNumber = async (tossNumber) => {
        methods.setProp('tossNumber', tossNumber)
    }

    const playerHasMarbleOnRoad = () => {
        for (let key in currentPlayerMarbles) {
            if (currentPlayerMarbles.hasOwnProperty(key) && currentPlayerMarbles[key] > 0)
                return true
        }
        return false
    }

    const tileStarts = [1, 11, 21, 31]
    const tilesStartEndLast = [[1, 40, 41, 44], [11, 10, 45, 48], [21, 20, 49, 52], [31, 30, 53, 56]]

    const whichMarblesCanMove = (tossNumber) => {
        const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
        let marblesCantMove = []

        currentPlayerMarbles.forEach((marblePosition, index) => {
            const currentMarbleNumber = index + 1
            const newPosition = positionCalculator(marblePosition, tossNumber)

            if (!newPosition)
                marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);logger.info('---------1--------')

            if (tossNumber !== 6 && marblePosition === 0)
                marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);logger.info('---------2--------')

            // checking other marbles in their starting tile conflict
            if (tileStarts.indexOf(newPosition) !== -1) { // if this current player marble target meet one of the tileStarts
                const targetPlayerNumber = tileStarts.indexOf(newPosition)
                if (positions.indexOf(targetPlayerNumber) !== -1) {
                    const targetPlayerNumberMarblesPosition = marblesPosition[(targetPlayerNumber + 1).toString()]
                    targetPlayerNumberMarblesPosition.forEach(targetMarblePosition => {
                        if (targetMarblePosition === tileStarts[targetPlayerNumber])
                            marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);logger.info('---------3--------')
                    })
                }
            }

            currentPlayerMarbles.forEach((marblePosition2, marbleNumber2) => {
                // player marble cant sit on same color
                // tossNumber === 6 && marblePosition === 0 &&
                if (marbleNumber2 + 1 !== currentMarbleNumber && newPosition === marblePosition2 && marblePosition2 !== 0 )
                    marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);logger.info('---------4--------')

                //player has not enough space in its last tiles
                if (marblePosition !== 0 && newPosition >= tilesStartEndLastCurrentPlayer[2]) {
                    if (marblePosition2 >= tilesStartEndLastCurrentPlayer[2] && marblePosition2 <= tilesStartEndLastCurrentPlayer[3])
                        if (newPosition === marblePosition2)
                            marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);logger.info('---------5--------')
                }
            })
        })
        return _.difference([1, 2, 3, 4], marblesCantMove)
    }

    const positionCalculator = (marblePosition, tossNumber) => {
        const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
        let newPosition
        if (marblePosition + tossNumber > tilesStartEndLastCurrentPlayer[3])
            return false

        if (marblePosition !== 0) {
            if (currentPlayer !== 1) {
                if (marblePosition + tossNumber > 40)
                    newPosition = marblePosition + tossNumber - 40
                else if (marblePosition + tossNumber > tilesStartEndLastCurrentPlayer[1] && marblePosition < tilesStartEndLastCurrentPlayer[0])
                    newPosition = marblePosition + tossNumber - tilesStartEndLastCurrentPlayer[1] + tilesStartEndLastCurrentPlayer[2] - 1
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
        await methods.setProp('remainingTime', maxTime)
        const tossNumber = parseInt(roomInfo.tossNumber)
        const marblePosition = currentPlayerMarbles[marbleNumber - 1]
        const newPosition = positionCalculator(marblePosition, tossNumber)
        let newMarblesPosition = JSON.parse(JSON.stringify(marblesPosition))
        newMarblesPosition[currentPlayer.toString()][marbleNumber - 1] = newPosition
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
            marblesPosition[key.toString()].forEach((val, index) => {
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
        await methods.setProp('remainingTime', maxTime)
        await methods.setProp('diceAttempts', 0)
        const numberOfplayers = positions.length
        const nextPlayer = currentPlayer + 1 > numberOfplayers ? 1 : currentPlayer + 1
        await methods.setProp('currentPlayer', nextPlayer)
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