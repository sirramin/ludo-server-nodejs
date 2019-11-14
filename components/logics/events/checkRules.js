const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {updateDiceAttempts, updateRemainingTime, getDiceAttempts} = require('../../redisHelper/logic')
const {changeTurn} = require('../gameFunctions')
const whichMarblesCanMove = require('./whichMarbles')
const {numberOfMarblesOnRoad, autoMove, manualMove, diceAgain, checkMarblesMeeting} = require('./gameEventsHelper')


const checkRules = async (roomId, diceNumber) => {
  if (diceNumber === 6) {
    updateDiceAttempts(roomId, 0)
    updateRemainingTime(roomId, timerMaxTime)
  }

  const numberOfMarblesOnRoad = await numberOfMarblesOnRoad(roomId)
  const marblesCanMove = await whichMarblesCanMove(roomId)

  if (numberOfMarblesOnRoad === 0) { /* All In Nest */
    await _handleZeroMarblesOnRoad(roomId, diceNumber, marblesCanMove)
  } else {
    if (marblesCanMove.length) {
      if (numberOfMarblesOnRoad === 1) {
        await _handleOneMarblesOnRoad(roomId, diceNumber, marblesCanMove)
      } else if (numberOfMarblesOnRoad > 1) {
        await _handleMoreThanOneMarblesOnRoad(roomId, diceNumber, marblesCanMove)
      }
    } else {
      await changeTurn(roomId)
    }
  }
}


const _handleZeroMarblesOnRoad = async (roomId, diceNumber, marblesCanMove) => {
  if (diceNumber === 6) {
    await _handleHit(roomId, diceNumber, marblesCanMove)
  } else {
    const diceAttempts = await getDiceAttempts(roomId)
    if (diceAttempts < 3) {
      diceAgain(roomId)
    } else {
      await changeTurn(roomId)
    }
  }
}

const _handleOneMarblesOnRoad = async (roomId, diceNumber, marblesCanMove) => {
  if (diceNumber === 6) {
    await manualMove(roomId)
  } else {
    await _handleHit(roomId, diceNumber, marblesCanMove)
  }
}

const _handleMoreThanOneMarblesOnRoad = async (roomId, diceNumber, marblesCanMove) => {
  if (numberOfMarblesOnRoad === 1) {
    await _handleHit(roomId, diceNumber, marblesCanMove)
  }
  if (numberOfMarblesOnRoad > 1) {
    await manualMove(roomId)
  }
}

const _handleHit = async (roomId, marblesCanMove) => {
  const marblesMeeting = await checkMarblesMeeting(roomId)
  if (marblesMeeting) {
    await manualMove(roomId, marblesCanMove)
  } else {
    autoMove()
  }
}

// if (numberOfMarblesOnRoad) {
// } else /* All In Nest */ {
//   if (diceNumber === 6) {
//     await methods.setProp('diceAttempts', 0)
//     await savediceNumber(diceNumber)
//   } else  /* diceNumber !== 6 */ {
//     const timeCanRollDice = (playerCastleNumber === 3) ? 4 : 3
//     // diceAttempts = parseInt(await methods.getProp('diceAttempts'))
//     logger.info('diceAttempts2: ' + diceAttempts)
//     if (diceAttempts === timeCanRollDice) {
//       await changeTurn()
//     } else methods.sendGameEvents(22, 'canRollDiceAgain', true)
//   }
// }

module.exports = checkRules