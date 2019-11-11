const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {getCurrentPlayer, getMarblesPosition} = require('../../redisHelper/logic')

const tileStarts = [1, 11, 21, 31]
const tilesStartEndLast = [[1, 40, 41, 44], [11, 10, 45, 48], [21, 20, 49, 52], [31, 30, 53, 56]]

const whichMarblesCanMove = async (roomId) => {
  const currentPlayer = await getCurrentPlayer(roomId)
  const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
  let marblesCantMove = []
  const marblesPosition = await getMarblesPosition(roomId)
  const currentPlayerMarbles = marblesPosition[currentPlayer]

  currentPlayerMarbles.forEach((marblePosition, index) => {
    const currentMarbleNumber = index + 1
    const newPosition = positionCalculator(marblePosition, tossNumber)

    if (!newPosition)
      marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);

    if (tossNumber !== 6 && marblePosition === 0)
      marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);

    // checking other marbles in their starting tile conflict
    if (tileStarts.indexOf(newPosition) !== -1 && (playerCastleNumber !== 4)) { // if this current player marble target meet one of the tileStarts
      const targetPlayerIndex = tileStarts.indexOf(newPosition)
      const targetPlayerMarblesPosition = marblesPosition[(targetPlayerIndex + 1).toString()]
      if (targetPlayerMarblesPosition && targetPlayerMarblesPosition.length) { // kick must include in check
        targetPlayerMarblesPosition.forEach(targetMarblePosition => {
          if (targetMarblePosition === tileStarts[targetPlayerIndex]) {
            marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])
            logger.info('---------3--------')
          }
        })
      }
    }

    currentPlayerMarbles.forEach((marblePosition2, marbleNumber2) => {
      // player marble cant sit on same color
      // tossNumber === 6 && marblePosition === 0 &&
      if (marbleNumber2 + 1 !== currentMarbleNumber && newPosition === marblePosition2 && marblePosition2 !== 0)
        marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);

      //player has not enough space in its last tiles
      if (marblePosition !== 0 && newPosition >= tilesStartEndLastCurrentPlayer[2]) {
        if (marblePosition2 >= tilesStartEndLastCurrentPlayer[2] && marblePosition2 <= tilesStartEndLastCurrentPlayer[3])
          if (newPosition === marblePosition2)
            marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);
        logger.info('---------5--------')
      }
    })
  })
  return _.difference([1, 2, 3, 4], marblesCantMove)
}


module.exports = whichMarblesCanMove