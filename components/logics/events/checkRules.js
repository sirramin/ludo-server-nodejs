const _ = require('lodash')
const {gameMeta: {diceMaxTime, autoMoveMaxTime}} = require('../../../common/config')
const {numberOfMarblesOnRoad, manualMove, diceAgain, checkMarblesMeeting, checkMarbleIsInItsFirstTile} = require('./gameEventsHelper')
const {updateDiceAttempts, updateRemainingTime, getDiceAttempts, getMarblesPosition, getCurrentPlayer} = require('../../redisHelper/logic')
const {changeTurn} = require('../gameFunctions')
const whichMarblesCanMove = require('./whichMarbles')
const move = require('./move')
const {emitToAll} = require('../../realtime/socketHelper')

let roomId, userId, diceNumber, marblesCanMove

const checkRules = async (roomIdP, userIdP, diceNumberP) => {
  roomId = roomIdP
  userId = userIdP
  diceNumber = diceNumberP

  if (diceNumber === 6) {
    updateDiceAttempts(roomId, 0)
    updateRemainingTime(roomId, diceMaxTime)
  }

  const MarblesOnRoad = await numberOfMarblesOnRoad(roomId)
  marblesCanMove = await whichMarblesCanMove(roomId)

  if (MarblesOnRoad === 0) { /* All In Nest */
    await _handleZeroMarblesOnRoad()
  } else {
    if (marblesCanMove.length) {
      if (MarblesOnRoad === 1) {
        await _handleOneMarblesOnRoad()
      } else if (MarblesOnRoad > 1) {
        await _handleMoreThanOneMarblesOnRoad(MarblesOnRoad)
      }
    } else {
      await changeTurn(roomId)
    }
  }
}


const _handleZeroMarblesOnRoad = async () => {
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

const _handleOneMarblesOnRoad = async () => {
  if (diceNumber === 6) {
    if(marblesCanMove.length === 1 && await checkMarbleIsInItsFirstTile(roomId, marblesCanMove)) {
      await _handleHit(roomId, marblesCanMove)
    } else {
      await manualMove(roomId, userId, marblesCanMove)
    }
  } else {
    await _handleHit(roomId, marblesCanMove)
  }
}

const _handleMoreThanOneMarblesOnRoad = async () => {
  if (marblesCanMove.length === 1) {
    await _handleHit(roomId, marblesCanMove)
  }
  if (marblesCanMove.length > 1) {
    await manualMove(roomId, userId, marblesCanMove)
  }
}

const _handleHit = async () => {
  const marblesMeeting = await checkMarblesMeeting(roomId, marblesCanMove)
  if (marblesMeeting.length) {
    await manualMove(roomId, userId, marblesCanMove)
  } else {
    _autoMove()
  }
}

const _autoMove = () => {
  emitToAll('autoMove', roomId, null)
  move(roomId, marblesCanMove[0])
  updateRemainingTime(roomId, autoMoveMaxTime)
}


module.exports = checkRules