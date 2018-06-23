const mongoose = require('../../common/mongoose-client');
const leagueSchema = mongoose.Schema({
    leagueId : Number,
    entranceCoins : Number,
    prize : Number,
    winsUnit : Number,
    defeatsUnit : Number,
    winsBaseScore : Number
});
const leagueModel = mongoose.model('leagues', leagueSchema);

module.exports = {
    leagueModel: leagueModel
}