const leaderboardModel = require('./model')
const findLeagueScore = async (leagueId) => {
    leaderboardModel.findOne({leagueId: leagueId})
}

module.exports = {
    findLeagueScore: findLeagueScore
}