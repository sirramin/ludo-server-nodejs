const _ = require('lodash')
const {getCurrentPlayer, getMarblesPosition, getDiceNumber, updateMarblesPosition} = require('../../redisHelper/logic')
const positionCalculator = require('./positionCalculator')
const {checkMarblesMeeting, hitPlayer, checkGameEnds} = require('./gameEventsHelper')
const {emitToAll} = require('../../realtime/socketHelper')
const {marblesPositionBuf} = require('../../../flatBuffers/marblesPosition/data/marblesPosition')
const {changeTurn} = require('../gameFunctions')

const move = async (roomId, marbleNumber) => {
  const currentPlayer = await getCurrentPlayer(roomId)
  const marblesPosition = await getMarblesPosition(roomId)
  const diceNumber = await getDiceNumber(roomId)
  const newPosition = await positionCalculator(roomId, marblesPosition[currentPlayer - 1][marbleNumber - 1], diceNumber)
  const marblesMeeting = await checkMarblesMeeting(roomId, [marbleNumber])
  marblesPosition[currentPlayer - 1][marbleNumber - 1] = newPosition
  updateMarblesPosition(roomId, marblesPosition)

  if (marblesMeeting.length) {
    await hitPlayer(roomId, marblesPosition, marblesMeeting)
  } else {
    emitToAll('marblesPosition', roomId, marblesPositionBuf(marblesPosition))
  }
  if (diceNumber === 6) {
    emitToAll('canRollDiceAgain', roomId)
  } else {
    await changeTurn(roomId)
  }
  checkGameEnds(marblesPosition, roomId)
}


module.exports = move