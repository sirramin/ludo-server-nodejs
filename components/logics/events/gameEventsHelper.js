const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {updateRemainingTime, increaseDiceAttempts, getMarblesPosition, getCurrentPlayer} = require('../../redisHelper/logic')
const {emitToSpecificPlayer, emitToAll} = require('../../realtime/socketHelper')
const {arrayBuf} = require('../../../flatBuffers/arr/data/arr')
const exp = {}

exp.autoMove = () => {

}

exp.manualMove = (roomId, marblesCanMove) => {
  emitToAll('marblesCanMove', roomId, arrayBuf(marblesCanMove))

}

exp.diceAgain = async () => {
  updateRemainingTime(roomId, timerMaxTime)
  methods.sendGameEvents(22, 'canRollDiceAgain', true)
}

exp.savediceNumber = async (diceNumber) => {
  await methods.setProp('diceNumber', diceNumber)
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

exp.checkMarblesMeeting = async (roomId, newPosition) => {
  const marblesPosition = await getMarblesPosition(roomId)
  let returnValue
  dance:
    for (let [playerIndex, marblePositions] of marblesPosition.entries()) {
      for (let [marbleIndex, marblePos] of marblePositions.entries()) {
        if (marblePos === newPosition) {
          returnValue = {
            meet: true,
            playerIndex,
            marbleIndex
          }
          break dance
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