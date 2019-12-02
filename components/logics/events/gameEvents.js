const _ = require('lodash')
const {gameMeta: {diceMaxTime}} = require('../../../common/config')
const {updateDiceNumber, increaseDiceAttempts} = require('../../redisHelper/logic')
const {findUserCurrentRoom} = require('../../redisHelper/user')
const {emitToSpecificPlayer, emitToAll} = require('../../realtime/socketHelper')
const {integerBuf} = require('../../../flatBuffers/int/data/int')
const checkRules = require('./checkRules')
const move = require('./move')
const exp = {}

exp.rollDice = async (userId) => {
  // await methods.setProp('remainingTime', maxTime)
  const roomId = await findUserCurrentRoom(userId)
  await increaseDiceAttempts(roomId)
  const diceNumber = _.random(1, 6)
  // const diceNumber = 6 //debug
  await updateDiceNumber(roomId, diceNumber)
  emitToAll('diceNumber', roomId, integerBuf(diceNumber))
  await checkRules(roomId, userId, diceNumber)
}

exp.move = async (userId, marbleNumber) => {
  const roomId = await findUserCurrentRoom(userId)
  await move(roomId, marbleNumber)
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