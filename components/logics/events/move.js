const _ = require('lodash')
const {gameMeta: {diceMaxTime}} = require('../../../common/config')
const {getCurrentPlayer, getMarblesPosition, getDiceNumber, updateMarblesPosition} = require('../../redisHelper/logic')
const positionCalculator = require('./positionCalculator')
const {checkMarblesMeeting, hitPlayer} = require('./gameEventsHelper')
const {emitToSpecificPlayer, emitToAll} = require('../../realtime/socketHelper')
const {positionBuf} = require('../../../flatBuffers/positions/data/positions')

const move = async (roomId, marbleNumber) => {
  const currentPlayer = await getCurrentPlayer(roomId)
  const marblesPosition = await getMarblesPosition(roomId)
  const diceNumber = await getDiceNumber(roomId)
  const newPosition = await positionCalculator(marblesPosition[currentPlayer - 1][marbleNumber - 1], diceNumber)
  marblesPosition[currentPlayer - 1][marbleNumber - 1] = newPosition
  updateMarblesPosition(roomId, marblesPosition)
  const marblesMeeting = await checkMarblesMeeting(roomId, [marbleNumber])

  if (marblesMeeting.length) {
    await hitPlayer(newPosition, marblesPosition, marblesMeeting, diceNumber)
  } else {
    emitToAll('positions', roomId, positionBuf(marblesPosition))

    if (diceNumber === 6)
      methods.sendGameEvents(22, 'canRollDiceAgain', true)

    const isGameEnds = checkGameEnds(marblesPosition, newMarblesPosition, newPosition)
    if (isGameEnds) {
      methods.sendGameEvents(24, 'gameEnd', {
        "winner": currentPlayer
      })
      const roomInfo = await methods.getProp('info')
      await methods.givePrize(userId)
      await methods.deleteRoom(roomId)
    }

    if (diceNumber !== 6)
      await changeTurn()
  }
}


module.exports = move