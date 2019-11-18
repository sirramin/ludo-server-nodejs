const _ = require('lodash')
const {gameMeta: {diceMaxTime}} = require('../../../common/config')
const {updateDiceAttempts, updateRemainingTime, getDiceAttempts} = require('../../redisHelper/logic')
const {changeTurn} = require('../gameFunctions')
const whichMarblesCanMove = require('./whichMarbles')
const {numberOfMarblesOnRoad, autoMove, manualMove, diceAgain, checkMarblesMeeting} = require('./gameEventsHelper')


const checkRules = async (roomId, diceNumber) => {
  if (diceNumber === 6) {
    updateDiceAttempts(roomId, 0)
    updateRemainingTime(roomId, diceMaxTime)
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
    await _handleHit(roomId, marblesCanMove)
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
    await _handleHit(roomId, marblesCanMove)
  }
}

const _handleMoreThanOneMarblesOnRoad = async (roomId, marblesCanMove) => {
  if (numberOfMarblesOnRoad === 1) {
    await _handleHit(roomId, marblesCanMove)
  }
  if (numberOfMarblesOnRoad > 1) {
    await manualMove(roomId, marblesCanMove)
  }
}

const _handleHit = async (roomId, marblesCanMove) => {
  const marblesMeeting = await checkMarblesMeeting(roomId, marblesCanMove)
  if (marblesMeeting.length) {
    await manualMove(roomId, marblesCanMove)
  } else {
    autoMove(roomId, marblesCanMove)
  }
}

module.exports = checkRules