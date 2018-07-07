module.exports = (dbUrl) => {
    const {mongooseClient, connections} = require('../../common/mongoose-client')(dbUrl);
    const leagueSchema = mongooseClient.Schema({
        leagueId: Number,
        entranceCoins: Number,
        prize: Number,
        winsUnit: Number,
        defeatsUnit: Number,
        winsBaseScore: Number
    });
    const leagueModel = connections[dbUrl].model('leagues', leagueSchema);

    module.exports = {
        leagueModel: leagueModel
    }
}