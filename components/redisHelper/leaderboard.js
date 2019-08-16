const redisClient = require('../../common/redis-client')
const {gameMeta, redis: redisConfig} = require('../../common/config')
const leaderboardService = require('../leaderboard/service')

module.exports = (roomId) => {

  const addToLeaderboard = async (userId, isWinner) => {
    const roomInfo = await getProp('info')
    const userDataParsed = JSON.parse(await redisClient.hget(redisConfig.prefixes.users, userId))
    if (roomInfo && roomInfo.hasOwnProperty('leagueId')) {
      const leagueId = roomInfo.leagueId
      await leaderboardService.addScore(userDataParsed.name, userId, leagueId, isWinner)
    }
  }

  const getleaderboardRank = async (userId) => {
    return await leaderboardService.getRank(userId)
  }

  const givePrize = async (userId, leagueId) => {
    return await leaderboardService.givePrize(userId, leagueId)
  }


  return {
    addToLeaderboard,
    getleaderboardRank,
  }
}