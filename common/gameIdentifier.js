const mongooseClient = require('mongoose');
mongooseClient.connect('mongodb://localhost/arta-game-platform');
const gamesSchema = new mongooseClient.Schema({
    name: {type: String, required: true}
})
const gamesModel = mongooseClient.model('games', gamesSchema);

const findGameName = async (req, res, next) => {
    const gameId = req.headers['gameId']
    if (!gameId) response(res, 'gameId is required!', 700);
    try {
        req.dbName = await gamesModel.findOne({_id: gameId}).lean().exec()
        next()
    }
    catch (err) {
        response(res, 'Game not found', 700);
    }
}
module.exports = findGameName