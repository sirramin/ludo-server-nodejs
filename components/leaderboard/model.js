const _ = require('lodash')
module.exports = (dbUrl) => {
    const {mongooseClient} = require('../../common/mongoose-client')(dbUrl)
    const leagueSchema = mongooseClient.Schema({
        leagueId: Number,
        entranceCoins: Number,
        prize: Number,
        winsUnit: Number,
        defeatsUnit: Number,
        winsBaseScore: Number
    });
    if (_.has(connections[dbUrl].models, 'leagues'))
        return connections[dbUrl].model('leagues');
    else
        return connections[dbUrl].model('leagues', leagueSchema);
}