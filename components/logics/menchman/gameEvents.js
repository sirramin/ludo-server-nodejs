module.exports = (io, socket, gameMeta) => {
    const numberOfplayers = players.length,
        matchMaking = require('../../realtime/matchMaking')(io, socket, gameMeta),
        roomId = matchMaking.findUserCurrentRoom(),
        methods = require('../../realtime/methods')(io, gameMeta, roomId)

    const getAct = (act) => {
        if (act === 'rollDice')
            rollDice()
        if (act === 'move')
            move()
    }

    let diceAttempts = 0
    const rollDice = (context, game, props, userId) => {
        const currentPlayer = methods.getProp('currentPlayer')
        diceAttempts = +1
        const tossNumber = Math.floor(Math.random() * 6) + 1
        context.log('tossNumber:' + tossNumber)
        checkRules(userId, props, tossNumber, numberOfplayers, currentPlayer, result => {
            return {tossNumber: tossNumber}
        })
    }

    const checkRules = (userId, props, tossNumber, numberOfplayers, currentPlayer) => {
        if (playerHasMarbleOnRoad(props, currentPlayer)) {
            whichMarbleCanMove(props, tossNumber, currentPlayer)
        }
        else /* All In Nest */ {
            if (tossNumber === 6) {
                remainingTime = maxTime
                return {marblesCanMove: ['marble1', 'marble2', 'marble3', 'marble4']}
            }
            else  /* tossNumber !== 6 */ {
                if (diceAttempts === 3) changeTurn();
                else return {canTossAgain: true}
            }
        }
    }

    const playerHasMarbleOnRoad = (props, currentPlayer) => {
        const currentPlayerMarbles = props.marblesPosition.currentPlayer
        for (let key in currentPlayerMarbles) {
            if (currentPlayerMarbles.hasOwnProperty(key) && currentPlayerMarbles[key] > 0)
                return true
        }
        return false
    }

    const tileStarts = [1, 11, 22, 33]
    const whichMarbleCanMove = (props, tossNumber, currentPlayer) => {
        const currentPlayerMarblesPosition = props.marblesPosition['player' + currentPlayer]
        let marblesCanMove = []
        // const tilesStartAndEnd = {'player1': [1, 40], 'player2': [11, 10], 'player3': [22, 21], 'player4': [33, 32]}
        currentPlayerMarblesPosition.forEach((currentMarbleNumber, marblePosition) => {
            let newPosition
            if (currentPlayer !== 1) {
                newPosition = (marblePosition + tossNumber > 40) ? marblePosition + tossNumber - 40 : marblePosition + tossNumber
            }
            if (currentPlayer === 1 && (marblePosition + tossNumber <= 44)) {
                newPosition = marblePosition + tossNumber
                // marblesCanMove.push(marble)
            }

            // checking other marbles in their starting tile conflict
            if (tileStarts.indexOf(newPosition)) {
                for (let playerNumber in props.marblesPosition) {
                    //check if any marble is in its starting point
                    if (playerNumber !== currentPlayer &&) {

                    }
                }
            }
        })
    }

    const isPlayerFirstTileOccupied = () => {

    }

    const hitPlayer = () => {

    }

    const move = () => {

    }

    const changeTurn = () => {
        remainingTime = maxTime
        diceAttempts = 0
        const nextPlayer = previousPlayer + 1 > numberOfplayers ? 1 : previousPlayer + 1
        game.sendServerMessage('changeTurn', {
            "player": nextPlayer,
            "decreaseOrb": false,
            "timeEnds": false
        }, {
            success: () => {
                context.log('Turn changed to palyer' + nextPlayer)
            },
            error: function (error) {
                context.log(error);
            }
        })
    }

    return ({
        // rollDice: rollDice,
        // move: move,
        getAct: getAct
    })

}