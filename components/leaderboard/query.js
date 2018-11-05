module.exports = (dbUrl) => {
    const leagueModel = require('./model')(dbUrl)

    const findLeagueScore = async (leagueId) => {
        const league = await leagueModel.findOne({leagueId: leagueId}).lean().exec()
        return league.winsBaseScore
    }

    const getLeagues = async () => {
        return await leagueModel.find().lean().exec()
    }

    return {
        findLeagueScore: findLeagueScore,
        getLeagues: getLeagues
    }
}