const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../common/config')
const exp = {}


exp.checkRules = async (roomId, tossNumber) => {
  // if (tossNumber === 6) {
  //   updateRemainingTime(roomId, timerMaxTime)
  // }

  const numberOfMarblesOnRoad = _numberOfMarblesOnRoad(roomId)
  if (numberOfMarblesOnRoad === 0) {
    if (tossNumber === 6) {
      _autoMove()
    }
    else {
        updateRemainingTime(roomId, timerMaxTime)
      methods.sendGameEvents(22, 'canRollDiceAgain', true)

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

const _autoMove = ()=>{

}


const saveTossNumber = async (tossNumber) => {
  await methods.setProp('tossNumber', tossNumber)
}

const _numberOfMarblesOnRoad = async (roomId) => {
  const marblesPosition = await getMarblesPosition(roomId)
  const currentPlayer = await getCurrentPlayer(roomId)
  const currentPlayerMarbles = marblesPosition[currentPlayer]
  let n = 0
  for (let key in currentPlayerMarbles) {
    if (currentPlayerMarbles.hasOwnProperty(key) && currentPlayerMarbles[key] > 0){
      n++
    }
  }
  return n
}

const tileStarts = [1, 11, 21, 31]
const tilesStartEndLast = [[1, 40, 41, 44], [11, 10, 45, 48], [21, 20, 49, 52], [31, 30, 53, 56]]

const whichMarblesCanMove = (tossNumber) => {
  const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
  let marblesCantMove = []

  currentPlayerMarbles.forEach((marblePosition, index) => {
    const currentMarbleNumber = index + 1
    const newPosition = positionCalculator(marblePosition, tossNumber)

    if (!newPosition)
      marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);

    if (tossNumber !== 6 && marblePosition === 0)
      marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);

    // checking other marbles in their starting tile conflict
    if (tileStarts.indexOf(newPosition) !== -1 && (playerCastleNumber !== 4)) { // if this current player marble target meet one of the tileStarts
      const targetPlayerIndex = tileStarts.indexOf(newPosition)
      const targetPlayerMarblesPosition = marblesPosition[(targetPlayerIndex + 1).toString()]
      if (targetPlayerMarblesPosition && targetPlayerMarblesPosition.length) { // kick must include in check
        targetPlayerMarblesPosition.forEach(targetMarblePosition => {
          if (targetMarblePosition === tileStarts[targetPlayerIndex]) {
            marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber])
            logger.info('---------3--------')
          }
        })
      }
    }

    currentPlayerMarbles.forEach((marblePosition2, marbleNumber2) => {
      // player marble cant sit on same color
      // tossNumber === 6 && marblePosition === 0 &&
      if (marbleNumber2 + 1 !== currentMarbleNumber && newPosition === marblePosition2 && marblePosition2 !== 0)
        marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);

      //player has not enough space in its last tiles
      if (marblePosition !== 0 && newPosition >= tilesStartEndLastCurrentPlayer[2]) {
        if (marblePosition2 >= tilesStartEndLastCurrentPlayer[2] && marblePosition2 <= tilesStartEndLastCurrentPlayer[3])
          if (newPosition === marblePosition2)
            marblesCantMove = _.union(marblesCantMove, [currentMarbleNumber]);
        logger.info('---------5--------')
      }
    })
  })
  return _.difference([1, 2, 3, 4], marblesCantMove)
}

const positionCalculator = (marblePosition, tossNumber) => {
  const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
  let newPosition
  if (marblePosition + tossNumber > tilesStartEndLastCurrentPlayer[3])
    return false

  if (marblePosition !== 0) {
    if (currentPlayer !== 1) {
      if (marblePosition + tossNumber > 40)
        newPosition = marblePosition + tossNumber - 40
      else if (marblePosition + tossNumber > tilesStartEndLastCurrentPlayer[1] && marblePosition < tilesStartEndLastCurrentPlayer[0])
        newPosition = marblePosition + tossNumber - tilesStartEndLastCurrentPlayer[1] + tilesStartEndLastCurrentPlayer[2] - 1
      else
        newPosition = marblePosition + tossNumber
    }
    if (currentPlayer === 1) {
      newPosition = marblePosition + tossNumber
    }
  } else if (marblePosition === 0 && tossNumber === 6)
    newPosition = tileStarts[currentPlayer - 1]

  return newPosition
}

const move = async (marbleNumber) => {
  await getInitialProperties()
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

const checkMarblesMeeting = (marblesPosition, newMarblesPosition, newPosition) => {
  let returnValue
  dance:
    for (let key in marblesPosition) {
      for (let j = 0; j < marblesPosition[key].length; j++) {
        if (marblesPosition[key][j] === newPosition) {
          returnValue = {
            meet: true,
            player: key,
            marble: j
          }
          break dance
        }
      }
    }
  logger.info(JSON.stringify(returnValue))
  if (returnValue)
    return returnValue
  else return {
    meet: false
  }

}

const checkGameEnds = (marblesPosition, newMarblesPosition) => {
  const tilesStartEndLastCurrentPlayer = tilesStartEndLast[currentPlayer - 1]
  const marblesAtEnd = []
  newMarblesPosition[currentPlayer.toString()].forEach((marblesPos, marbleIndx) => {
    if (marblesPos >= tilesStartEndLastCurrentPlayer[2] && marblesPos <= tilesStartEndLastCurrentPlayer[2])
      marblesAtEnd.push(marblesPos)
  })
  const diff = _.difference([tilesStartEndLastCurrentPlayer[2], tilesStartEndLastCurrentPlayer[2] + 1, tilesStartEndLastCurrentPlayer[3] - 1, tilesStartEndLastCurrentPlayer[3]], marblesAtEnd)
  return diff.length === 0
}

const hitPlayer = async (newPosition, newMarblesPosition, marblesMeeting, tossNumber) => {
  newMarblesPosition[marblesMeeting.player][marblesMeeting.marble] = 0
  logger.info('marblesMeeting.marble: ' + marblesMeeting.marble)
  await methods.setProp('marblesPosition', JSON.stringify(newMarblesPosition))
  methods.sendGameEvents(23, 'marblesPosition', newMarblesPosition)
  await increaseHitAndBeat(currentPlayer, marblesMeeting.player)
  if (tossNumber === 6)
    methods.sendGameEvents(22, 'canRollDiceAgain', true)
  if (tossNumber !== 6)
    await changeTurn()
}

module.exports = exp