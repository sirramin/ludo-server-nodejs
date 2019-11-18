const _ = require('lodash')
const {gameMeta: {diceMaxTime, autoMoveMaxTime, manualMoveMaxTime}} = require('../../../common/config')
const {updateRemainingTime, getMarblesPosition, getCurrentPlayer, getDiceNumber} = require('../../redisHelper/logic')
const {emitToSpecificPlayer, emitToAll} = require('../../realtime/socketHelper')
const {arrayBuf} = require('../../../flatBuffers/arr/data/arr')
const positionCalculator = require('./positionCalculator')
const exp = {}

exp.autoMove = (roomId, marblesCanMove) => {
  emitToAll('autoMove', roomId, arrayBuf(marblesCanMove))
  updateRemainingTime(roomId, autoMoveMaxTime)
}

exp.manualMove = (roomId, marblesCanMove) => {
  emitToAll('marblesCanMove', roomId, arrayBuf(marblesCanMove))
  updateRemainingTime(roomId, manualMoveMaxTime)
}

exp.diceAgain = async (roomId) => {
  updateRemainingTime(roomId, diceMaxTime)
  emitToAll('canRollDiceAgain', roomId)
}

exp.numberOfMarblesOnRoad = async (roomId) => {
  const marblesPosition = await getMarblesPosition(roomId)
  const currentPlayer = await getCurrentPlayer(roomId)
  const currentPlayerMarbles = marblesPosition[currentPlayer]
  let n = 0
  for (let key in currentPlayerMarbles) {
    if (currentPlayerMarbles.hasOwnProperty(key) && currentPlayerMarbles[key] > 0) {
      n++
    }
  }
  return n
}

exp.checkMarblesMeeting = async (roomId, marblesCanMove) => {
  const diceNumber = await getDiceNumber(roomId)
  const marblesPosition = await getMarblesPosition(roomId)
  // const currentPlayer = await getCurrentPlayer(roomId)
  // const currentPlayerMarbles = marblesPosition[currentPlayer]

  let returnValue = []
  dance:
    for (let [currentPlayerMarbleIndex, currentPlayerMarblePositions] of marblesCanMove.entries()) {
      const newPosition = await positionCalculator(currentPlayerMarblePositions, diceNumber)

      for (let [playerIndex, marblePositions] of marblesPosition.entries()) {
        for (let [marbleIndex, marblePos] of marblePositions.entries()) {
          if (marblePos === newPosition) {
            returnValue.push({
              meet: true,
              playerIndex,
              marbleIndex
            })
            break dance
          }
        }
      }
    }
  logger.info('marblesMeeting: ' + JSON.stringify(returnValue))
  if (returnValue)
    return returnValue
  else return {
    meet: false
  }
}

exp.checkGameEnds = (marblesPosition, newMarblesPosition) => {
  const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
  const marblesAtEnd = []
  newMarblesPosition[currentPlayer.toString()].forEach((marblesPos, marbleIndx) => {
    if (marblesPos >= tilesStartEndLastCurrentPlayer[2] && marblesPos <= tilesStartEndLastCurrentPlayer[2])
      marblesAtEnd.push(marblesPos)
  })
  const diff = _.difference([tilesStartEndLastCurrentPlayer[2], tilesStartEndLastCurrentPlayer[2] + 1, tilesStartEndLastCurrentPlayer[3] - 1, tilesStartEndLastCurrentPlayer[3]], marblesAtEnd)
  return diff.length === 0
}

exp.hitPlayer = async (newPosition, newMarblesPosition, marblesMeeting, diceNumber) => {
  newMarblesPosition[marblesMeeting.player][marblesMeeting.marble] = 0
  logger.info('marblesMeeting.marble: ' + marblesMeeting.marble)
  await methods.setProp('marblesPosition', JSON.stringify(newMarblesPosition))
  methods.sendGameEvents(23, 'marblesPosition', newMarblesPosition)
  await increaseHitAndBeat(currentPlayer, marblesMeeting.player)
  if (diceNumber === 6)
    methods.sendGameEvents(22, 'canRollDiceAgain', true)
  if (diceNumber !== 6)
    await changeTurn()
}

module.exports = exp