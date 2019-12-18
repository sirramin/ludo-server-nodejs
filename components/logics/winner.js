const {emitToSpecificPlayer, emitToAll} = require('../realtime/socketHelper')
const {getPositions} = require('../redisHelper/logic')
const {stringBuf} = require('../../flatBuffers/str/data/str')

const makeRemainingPlayerWinner = async (roomId, playerIndex) => {
  const positions = await getPositions(roomId)
  for (const [index, position] of positions.entries()) {
    if (index !== playerIndex) {
      emitToSpecificPlayer('winner', position.userId, stringBuf('winner is: ' + positions[playerIndex].username))
    }
  }
  const winnerId = positions[playerIndex].userId
  emitToSpecificPlayer('youWin', winnerId, null)

  // await addToLeaderboard(winnerId, true)
  // await givePrize(winnerId, info.leagueId)
}

module.exports = makeRemainingPlayerWinner
