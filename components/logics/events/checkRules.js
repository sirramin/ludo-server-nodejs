const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {getCurrentPlayer} = require('../../redisHelper/logic')
const whichMarblesCanMove = require('./whichMarbles')
const {numberOfMarblesOnRoad} = require('./gameEventsHelper')

const checkRules = async (roomId, diceNumber) => {
  // if (diceNumber === 6) {
  //   updateRemainingTime(roomId, timerMaxTime)
  // }

  const numberOfMarblesOnRoad = numberOfMarblesOnRoad(roomId)
  if (numberOfMarblesOnRoad === 0) {
    if (diceNumber === 6) {
      const marblesMeeting = await _checkMarblesMeeting(roomId)
      if (marblesMeeting) {
        whichMarblesCanMove(roomId)
      } else {
        _autoMove()
      }
    } else {
      _diceAgain()
    }
  }

  if (numberOfMarblesOnRoad === 1) {
    if (diceNumber === 6) {
      _autoMove()
    } else {
      _diceAgain()
    }
  }


  if (numberOfMarblesOnRoad) {
    const marbs = whichMarblesCanMove(diceNumber)
    if (marbs.length > 0) {
      logger.info(JSON.stringify(marbs))
      methods.sendGameEvents(21, 'marblesCanMove', marbs)
      await savediceNumber(diceNumber)
    } else {
      // methods.sendGameEvents(21, 'marblesCanMove', [])
      if (diceNumber === 6)
        methods.sendGameEvents(22, 'canRollDiceAgain', true)
      await changeTurn()
    }
  } else /* All In Nest */ {
    if (diceNumber === 6) {
      await methods.setProp('diceAttempts', 0)
      await savediceNumber(diceNumber)
      methods.sendGameEvents(21, 'marblesCanMove', [1, 2, 3, 4])
      logger.info(JSON.stringify([1, 2, 3, 4]))
    } else  /* diceNumber !== 6 */ {
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