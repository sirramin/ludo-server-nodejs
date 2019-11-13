const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {updateDiceAttempts, updateRemainingTime, getDiceAttempts} = require('../../redisHelper/logic')
const {changeTurn} = require('../gameFunctions')
const whichMarblesCanMove = require('./whichMarbles')
const {numberOfMarblesOnRoad, autoMove, diceAgain, checkMarblesMeeting} = require('./gameEventsHelper')
const {arrayBuf} = require('../../../flatBuffers/arr/data/arr')
const {emitToSpecificPlayer, emitToAll} = require('../../realtime/socketHelper')


const checkRules = async (roomId, diceNumber) => {
  if (diceNumber === 6) {
    updateDiceAttempts(roomId, 0)
    updateRemainingTime(roomId, timerMaxTime)
  }

  const numberOfMarblesOnRoad = await numberOfMarblesOnRoad(roomId)
  const marblesMeeting = await checkMarblesMeeting(roomId)
  const marblesCanMove = await whichMarblesCanMove(roomId)

  if (numberOfMarblesOnRoad === 0) { /* All In Nest */
    await _handleZeroMarblesOnRoad(roomId, diceNumber, marblesMeeting, marblesCanMove)
  } else {
    if (marblesCanMove.length) {
      if (numberOfMarblesOnRoad === 1) {
        await _handleOneMarblesOnRoad(roomId, diceNumber, marblesMeeting, marblesCanMove)
      } else if (numberOfMarblesOnRoad > 1) {
        await _handleMoreThanOneMarblesOnRoad(roomId, diceNumber, marblesMeeting, marblesCanMove)
      }
    } else {
      await changeTurn(roomId)
    }
  }
}


const _handleZeroMarblesOnRoad = async (roomId, diceNumber, marblesMeeting, marblesCanMove) => {
  if (diceNumber === 6) {
    await _handleHit(roomId, diceNumber, marblesCanMove, marblesMeeting)
  } else {
    const diceAttempts = getDiceAttempts(roomId)
    if (diceAttempts < 3) {
      diceAgain()
    } else {
      await changeTurn(roomId)
    }
  }
}

const _handleOneMarblesOnRoad = async (roomId, diceNumber, marblesCanMove, marblesMeeting) => {
  if (diceNumber === 6) {
    emitToAll('marblesCanMove', roomId, arrayBuf(marblesCanMove))
  } else {
    await _handleHit(roomId, diceNumber, marblesCanMove, marblesMeeting)
  }
}

const _handleMoreThanOneMarblesOnRoad = async (roomId, diceNumber, marblesCanMove, marblesMeeting) => {
  if (numberOfMarblesOnRoad === 1) {
    await _handleHit(roomId, diceNumber, marblesCanMove, marblesMeeting)
  }
  if (numberOfMarblesOnRoad > 1) {
    emitToAll('marblesCanMove', roomId, arrayBuf(marblesCanMove))
  }
}

const _handleHit = async (roomId, diceNumber, marblesCanMove, marblesMeeting) => {
  if (marblesMeeting) {
    emitToAll('marblesCanMove', roomId, arrayBuf(marblesCanMove))
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