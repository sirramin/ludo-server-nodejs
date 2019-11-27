const _ = require('lodash')
const {getCurrentPlayer, getMarblesPosition, getDiceNumber} = require('../../redisHelper/logic')
const positionCalculator = require('./positionCalculator')
const {tiles: {tileStarts, tilesStartEndLast}} = require('../../../common/config')


const whichMarblesCanMove = async (roomId) => {
  const currentPlayer = await getCurrentPlayer(roomId)
  const marblesPosition = await getMarblesPosition(roomId)
  const diceNumber = await getDiceNumber(roomId)
  const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
  let marblesCantMove = []
  const currentPlayerMarbles = marblesPosition[currentPlayer - 1]

  for (const [index, marblePosition] of currentPlayerMarbles.entries()) {

    const currentMarbleNumber = index + 1
    const newPosition = await positionCalculator(roomId, marblePosition, diceNumber)

    if (!newPosition) {
      marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])
    }

    if (diceNumber !== 6 && marblePosition === 0) {
      marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])
    }

    if (tileStarts.indexOf(newPosition) !== -1) {
      marblesCantMove = _tileStartConflict(newPosition, marblesPosition, marblesCantMove, currentMarbleNumber)
    }

    for (const [index2, marblePosition2] of currentPlayerMarbles.entries()) {
      marblesCantMove = _conflictSameColor(marblesCantMove, currentMarbleNumber, index2, newPosition, marblePosition2)
      marblesCantMove = _conflictInGateWay(marblesCantMove, currentMarbleNumber, marblePosition2, tilesStartEndLastCurrentPlayer, newPosition)
    }

  }

  return _.difference([1, 2, 3], marblesCantMove)
}

const _tileStartConflict = (newPosition, marblesPosition, marblesCantMove, currentMarbleNumber) => {
  // checking other marbles in their starting tile conflict
  // if this current player marble target meet one of the tileStarts
  const targetPlayerIndex = tileStarts.indexOf(newPosition)
  const targetPlayerMarblesPosition = marblesPosition[(targetPlayerIndex + 1).toString()]
  if (targetPlayerMarblesPosition && targetPlayerMarblesPosition.length) { // kick must include in check
    targetPlayerMarblesPosition.forEach(targetMarblePosition => {
      if (targetMarblePosition === tileStarts[targetPlayerIndex]) {
        logger.info('---------3--------')
        return _.union(marblesCantMove, [currentMarbleNumber])
      }
    })
  }
  return marblesCantMove
}

const _conflictSameColor = (marblesCantMove, currentMarbleNumber, index2, newPosition, marblePosition2) => {
  // player marble cant sit on same color
  // diceNumber === 6 && marblePosition === 0 &&
  logger.info('---------5--------')
  if (index2 + 1 !== currentMarbleNumber && newPosition === marblePosition2 && marblePosition2 !== 0) {
    return _.union(marblesCantMove, [currentMarbleNumber])
  }
  return marblesCantMove
}

const _conflictInGateWay = (marblesCantMove, currentMarbleNumber, marblePosition2, tilesStartEndLastCurrentPlayer, newPosition) => {
  //player has not enough space in its last tiles
  logger.info('---------6--------')
  if (marblePosition2 >= tilesStartEndLastCurrentPlayer[2] && marblePosition2 <= tilesStartEndLastCurrentPlayer[3] && newPosition === marblePosition2) {
    return _.union(marblesCantMove, [currentMarbleNumber])
  }
  return marblesCantMove
}


module.exports = whichMarblesCanMove