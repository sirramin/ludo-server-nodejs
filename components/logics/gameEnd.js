const exp = {}

exp.makeRemainingPlayerWinner = async (roomId) => {
  const players = await getProp('players')
  const positions = await getProp('positions')
  // if(positions && positions.length) {
  const winnerPlayerNumber = positions[0].player
  const winnerId = players[0]
  await setProp('winner', winnerId)
  sendGameEvents(24, 'gameEnd', {
    "winner": winnerPlayerNumber
  })
  await deleteUserRoom(winnerId)
  await addToLeaderboard(winnerId, true)
  await givePrize(winnerId, info.leagueId)
  const winnerSocketId = await getUserSocketIdFromRedis(winnerId)
  io.of('/').adapter.remoteDisconnect(winnerSocketId, true, (err) => {
    logger.info('---------- remoteDisconnect winner-------------------')
  })
  await deleteRoom(roomId)
  // const roomInfo = await getProp('info')
  // roomInfo.state = 'finished'
  // await setProp('info', JSON.stringify(roomInfo))
  // }
}

module.exports = exp
