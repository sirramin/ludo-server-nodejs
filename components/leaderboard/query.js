const {leagueModel} = require('./model')
const findLeagueScore = async (leagueId) => {
    const league = await leagueModel.findOne({leagueId: leagueId}).lean().exec()
    return league.winsBaseScore
}

module.exports = {
    findLeagueScore: findLeagueScore
}