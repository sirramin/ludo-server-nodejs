const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {getCurrentPlayer} = require('../../redisHelper/logic')

const checkRules = async (roomId, tossNumber) => {
  // if (tossNumber === 6) {
  //   updateRemainingTime(roomId, timerMaxTime)
  // }

  const numberOfMarblesOnRoad = _numberOfMarblesOnRoad(roomId)
  if (numberOfMarblesOnRoad === 0) {
    if (tossNumber === 6) {
      const marblesMeeting = await _checkMarblesMeeting(roomId)
      if (marblesMeeting) {
        _whichMarblesCanMove
      } else {
        _autoMove()
      }
    } else {
      _diceAgain()
    }
  }

  if (numberOfMarblesOnRoad === 1) {
    if (tossNumber === 6) {
      _autoMove()
    } else {
      _diceAgain()
    }
  }


  if (numberOfMarblesOnRoad) {
    const marbs = whichMarblesCanMove(tossNumber)
    if (marbs.length > 0) {
      logger.info(JSON.stringify(marbs))
      methods.sendGameEvents(21, 'marblesCanMove', marbs)
      await saveTossNumber(tossNumber)
    } else {
      // methods.sendGameEvents(21, 'marblesCanMove', [])
      if (tossNumber === 6)
        methods.sendGameEvents(22, 'canRollDiceAgain', true)
      await changeTurn()
    }
  } else /* All In Nest */ {
    if (tossNumber === 6) {
      await methods.setProp('diceAttempts', 0)
      await saveTossNumber(tossNumber)
      methods.sendGameEvents(21, 'marblesCanMove', [1, 2, 3, 4])
      logger.info(JSON.stringify([1, 2, 3, 4]))
    } else  /* tossNumber !== 6 */ {
      const timeCanRollDice = (playerCastleNumber === 3) ? 4 : 3
      // diceAttempts = parseInt(await methods.getProp('diceAttempts'))
      logger.info('diceAttempts2: ' + diceAttempts)
      if (diceAttempts === timeCanRollDice) {
        await changeTurn()
      } else methods.sendGameEvents(22, 'canRollDiceAgain', true)
    }
  }
}

module.exports = checkRules