const _ = require('lodash')
const mongooseClientClass = require('../../common/mongoose-client-class')

const leaderboardModelClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        const mongooseClientObj = new mongooseClientClass(dbUrl)
        this.mongooseClient = mongooseClientObj.getClient()
        this.leagueSchema = this.mongooseClient.Schema({
            leagueId: Number,
            entranceCoins: Number,
            prize: Number,
            winsUnit: Number,
            defeatsUnit: Number,
            winsBaseScore: Number
        })
    }

    getModel() {
        if (_.has(connections[this.dbUrl].models, 'leagues'))
            return connections[this.dbUrl].model('leagues')
        else
            return connections[this.dbUrl].model('leagues', this.leagueSchema)
    }
}

module.exports = leaderboardModelClass


