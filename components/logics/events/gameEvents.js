const _ = require('lodash')
const {gameMeta: {timerMaxTime}} = require('../../../common/config')
const {updateRemainingTime, increaseDiceAttempts, getMarblesPosition, getCurrentPlayer} = require('../../redisHelper/logic')
const {findUserCurrentRoom} = require('../../redisHelper/user')
const {emitToSpecificPlayer, emitToAll} = require('../../realtime/socketHelper')
const {integerBuf} = require('../../../flatBuffers/int/data/int')
const {checkRules} = require('./checkRules')
const exp = {}

exp.rollDice = async (userId) => {
  // await methods.setProp('remainingTime', maxTime)
  const roomId = await findUserCurrentRoom(userId)
  await increaseDiceAttempts(roomId)
  const tossNumber = _.random(1, 6)
  emitToSpecificPlayer('tossNumber', userId, integerBuf(tossNumber))
  await checkRules(roomId, tossNumber)
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

const chat = (msg) => {
  methods.broadcast(socket, msg)
}

const profile = async () => {
  await getInitialProperties()
  let stats = []
  for (let i in positions) {
    const pos = positions[i]
    const leaderboardData = await methods.getleaderboardRank(pos.userId)
    logger.info('pos.userId: ' + pos.userId)
    const userDataParsed = await methods.getUserData(pos.userId)
    const castleNumber = userDataParsed.castleNumber ? parseInt(userDataParsed.castleNumber) : 1
    const record = userDataParsed.record ? parseInt(userDataParsed.record) : 0
    const hit = hits[i]
    const beat = beats[i]
    const win = parseInt(userDataParsed.win)
    const lose = parseInt(userDataParsed.lose)
    const victoryRate = (win / (win + lose)) * 100
    stats.push({
      leaderboardRank: leaderboardData.rank,
      name: pos.name,
      player: pos.player,
      victoryRate: (win + lose >= 5) ? victoryRate : 'less than 5',
      record: record,
      castleNumber: castleNumber,
      hit: hit,
      beat: beat
    })
  }
  await methods.sendEventToSpecificSocket(userId, 25, 'profile', stats)
}

module.exports = exp