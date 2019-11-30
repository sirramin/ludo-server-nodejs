const _ = require('lodash')
const {gameMeta: {diceMaxTime, autoMoveMaxTime, manualMoveMaxTime}} = require('../../../common/config')
const {updateRemainingTime, getMarblesPosition, getCurrentPlayer, getDiceNumber, updateMarblesPosition} = require('../../redisHelper/logic')
const {emitToSpecificPlayer, emitToAll} = require('../../realtime/socketHelper')
const {arrayBuf} = require('../../../flatBuffers/arr/data/arr')
const {marblesPositionBuf} = require('../../../flatBuffers/marblesPosition/data/marblesPosition')
const positionCalculator = require('./positionCalculator')
const {tiles: {tileStarts, tilesStartEndLast}} = require('../../../common/config')
const exp = {}


exp.manualMove = async (roomId, userId, marblesCanMove) => {
  emitToSpecificPlayer('marblesCanMove', userId, arrayBuf(marblesCanMove))
  updateRemainingTime(roomId, manualMoveMaxTime)
}

exp.diceAgain = async (roomId) => {
  updateRemainingTime(roomId, diceMaxTime)
  emitToAll('canRollDiceAgain', roomId)
}

exp.numberOfMarblesOnRoad = async (roomId) => {
  const marblesPosition = await getMarblesPosition(roomId)
  const currentPlayer = await getCurrentPlayer(roomId)
  const currentPlayerMarbles = marblesPosition[currentPlayer - 1]
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
  const currentPlayer = await getCurrentPlayer(roomId)
  const currentPlayerMarbles = marblesPosition[currentPlayer - 1]

  let returnValue = []
  for (let currentPlayerMarbleIndex of marblesCanMove) {
    const currentPlayerMarblePosition = currentPlayerMarbles[parseInt(currentPlayerMarbleIndex) - 1]
    const newPosition = await positionCalculator(roomId, currentPlayerMarblePosition, diceNumber)

      dance:
        for (let [playerIndex, marblePositions] of marblesPosition.entries()) {
          if (currentPlayer - 1 !== playerIndex) {
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

  }
  if (returnValue.length) {
    logger.info('marblesMeeting: ' + returnValue.length)
  }
  return returnValue
}

exp.checkGameEnds = async (marblesPosition, roomId) => {
  const currentPlayer = await getCurrentPlayer(roomId)
  const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
  const marblesAtEnd = []
  marblesPosition[currentPlayer - 1].forEach((marblesPos) => {
    if (marblesPos >= tilesStartEndLastCurrentPlayer[2] && marblesPos <= tilesStartEndLastCurrentPlayer[2])
      marblesAtEnd.push(marblesPos)
  })
  const diff = _.difference([tilesStartEndLastCurrentPlayer[2], tilesStartEndLastCurrentPlayer[2] + 1, tilesStartEndLastCurrentPlayer[3] - 1, tilesStartEndLastCurrentPlayer[3]], marblesAtEnd)
  if (diff.length === 0) {
    emitToAll('gameEnd', currentPlayer)
    // await methods.givePrize(userId)
    // await methods.deleteRoom(roomId)
  }
}

exp.hitPlayer = async (newPosition, newMarblesPosition, marblesMeeting, diceNumber, roomId) => {
  newMarblesPosition[marblesMeeting[0].playerIndex][marblesMeeting[0].marbleIndex] = 0
  logger.info('marblesMeeting.playerIndex: ' + marblesMeeting[0].playerIndex + ' marblesMeeting.marbleIndex: ' + marblesMeeting[0].marbleIndex)
  updateMarblesPosition(roomId, newMarblesPosition)
  emitToAll('marblesPosition', roomId, marblesPositionBuf(newMarblesPosition))
}

exp.checkMarbleIsInItsFirstTile = async (roomId, marblesCanMove) => {
  const marblesPosition = await getMarblesPosition(roomId)
  const currentPlayer = await getCurrentPlayer(roomId)
  return marblesPosition[currentPlayer - 1][marblesCanMove[0] - 1] === tileStarts[currentPlayer - 1]
}

module.exports = exp