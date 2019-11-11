const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {getCurrentPlayer, getMarblesPosition} = require('../../redisHelper/logic')

const move = async (marbleNumber) => {
  // await methods.setProp('remainingTime', maxTime)
  const tossNumber = parseInt(roomInfo.tossNumber)
  const marblePosition = currentPlayerMarbles[marbleNumber - 1]
  const newPosition = positionCalculator(marblePosition, tossNumber)
  let newMarblesPosition = JSON.parse(JSON.stringify(marblesPosition))
  newMarblesPosition[currentPlayer.toString()][marbleNumber - 1] = newPosition
  await methods.setProp('marblesPosition', JSON.stringify(newMarblesPosition))
  const marblesMeeting = checkMarblesMeeting(marblesPosition, newMarblesPosition, newPosition)

  if (marblesMeeting.meet)
    await hitPlayer(newPosition, newMarblesPosition, marblesMeeting, tossNumber)
  else {
    methods.sendGameEvents(23, 'marblesPosition', newMarblesPosition)

    if (tossNumber === 6)
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

    if (tossNumber !== 6)
      await changeTurn()
  }
}


module.exports = move