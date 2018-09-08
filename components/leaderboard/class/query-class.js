const leagueModelClass = require('./model-class')

const leaderboardQueryClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        this.leagueModelObj = new leagueModelClass(dbUrl)
        this.leagueModel = this.leagueModelObj.getModel()
    }

    async findLeagueScore(leagueId) {
        const league = await this.leagueModel.findOne({leagueId: leagueId}).lean().exec()
        return league.winsBaseScore
    }

    async getLeagues() {
        return await this.leagueModel.find().lean().exec()
    }
}

module.exports = leaderboardQueryClass


