const _ = require('lodash')
const {gameMeta: {diceMaxTime}} = require('../../../common/config')
const {getCurrentPlayer, getMarblesPosition} = require('../../redisHelper/logic')

const positionCalculator = (marblePosition, diceNumber) => {
  const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
  let newPosition
  if (marblePosition + diceNumber > tilesStartEndLastCurrentPlayer[3])
    return false

  if (marblePosition !== 0) {
    if (currentPlayer !== 1) {
      if (marblePosition + diceNumber > 40)
        newPosition = marblePosition + diceNumber - 40
      else if (marblePosition + diceNumber > tilesStartEndLastCurrentPlayer[1] && marblePosition < tilesStartEndLastCurrentPlayer[0])
        newPosition = marblePosition + diceNumber - tilesStartEndLastCurrentPlayer[1] + tilesStartEndLastCurrentPlayer[2] - 1
      else
        newPosition = marblePosition + diceNumber
    }
    if (currentPlayer === 1) {
      newPosition = marblePosition + diceNumber
    }
  } else if (marblePosition === 0 && diceNumber === 6)
    newPosition = tileStarts[currentPlayer - 1]

  return newPosition
}


module.exports = positionCalculator