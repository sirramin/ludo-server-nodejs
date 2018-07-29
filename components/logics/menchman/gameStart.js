module.exports = () => {

    const sendPositions = () => {
        let positions = []
        let marblesPosition
        players.forEach((item, index) => {
            const playerNumber = (index + 1)
            positions.push({player: playerNumber, userId: usersId[index]})
            marblesPosition['player' + playerNumber] = [{marble1: 0}, {marble2: 0}, {marble3: 0}, {marble4: 0}]
        })
        props.positions = positions
        props.marblesPosition = marblesPosition
        props.orbs = {player1: 3, player2: 3, player3: 3, player4: 3}
        game.sendServerMessage('positions', {"positions": JSON.stringify(positions)}, {
            success: () => {
                firstTurn(positions, positions.length)
            },
            error: (error) => {
                context.log(error)
            }
        })
    }

    return {
        sendPositions: sendPositions
    }
}