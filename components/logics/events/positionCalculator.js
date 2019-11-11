const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {getCurrentPlayer, getMarblesPosition} = require('../../redisHelper/logic')

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
  } else if (marblePosition === 0 && tossNumber === 6)
    newPosition = tileStarts[currentPlayer - 1]

  return newPosition
}


module.exports = positionCalculator