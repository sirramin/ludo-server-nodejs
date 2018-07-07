module.exports = (dbName) => {
    const {mongooseClient, connections} = require('../../common/mongoose-client')(dbName);
    const leagueSchema = mongooseClient.Schema({
        leagueId: Number,
        entranceCoins: Number,
        prize: Number,
        winsUnit: Number,
        defeatsUnit: Number,
        winsBaseScore: Number
    });
    const leagueModel = connections.model('leagues', leagueSchema);

    module.exports = {
        leagueModel: leagueModel
    }
}