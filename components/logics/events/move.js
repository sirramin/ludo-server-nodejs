const _ = require('lodash')
const {getCurrentPlayer, getMarblesPosition, getDiceNumber, updateMarblesPosition} = require('../../redisHelper/logic')
const positionCalculator = require('./positionCalculator')
const {checkMarblesMeeting, hitPlayer} = require('./gameEventsHelper')
const {emitToAll} = require('../../realtime/socketHelper')
const {marblesPositionBuf} = require('../../../flatBuffers/marblesPosition/data/marblesPosition')
const {changeTurn} = require('../gameFunctions')

const move = async (roomId, marbleNumber) => {
  const currentPlayer = await getCurrentPlayer(roomId)
  const marblesPosition = await getMarblesPosition(roomId)
  const diceNumber = await getDiceNumber(roomId)
  const newPosition = await positionCalculator(roomId, marblesPosition[currentPlayer - 1][marbleNumber - 1], diceNumber)
  marblesPosition[currentPlayer - 1][marbleNumber - 1] = newPosition
  updateMarblesPosition(roomId, marblesPosition)
  const marblesMeeting = await checkMarblesMeeting(roomId, [marbleNumber])

  if (marblesMeeting.length) {
    await hitPlayer(newPosition, marblesPosition, marblesMeeting, diceNumber)
  } else {
    emitToAll('marblesPosition', roomId, marblesPositionBuf(marblesPosition))

    if (diceNumber === 6) {
      emitToAll('canRollDiceAgain', roomId)
    } else {
      await changeTurn(roomId)
    }

    //   const isGameEnds = checkGameEnds(marblesPosition, newMarblesPosition, newPosition)
    //   if (isGameEnds) {
    //     methods.sendGameEvents(24, 'gameEnd', {
    //       "winner": currentPlayer
    //     })
    //     const roomInfo = await methods.getProp('info')
    //     await methods.givePrize(userId)
    //     await methods.deleteRoom(roomId)
    //   }
    //

  }
}


module.exports = move