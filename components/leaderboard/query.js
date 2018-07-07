module.exports = ()=> {
    const {leagueModel} = require('./model')(dbUrl)

    const findLeagueScore = async (leagueId) => {
        const league = await leagueModel.findOne({leagueId: leagueId}).lean().exec()
        return league.winsBaseScore
    }

    return {
        findLeagueScore: findLeagueScore
    }
}