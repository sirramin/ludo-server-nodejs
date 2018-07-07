const {mongooseClient, db} = require('./mongoose-client')('arta-game-platform')
const response = require('./response')
const gamesSchema = new mongooseClient.Schema({
    name: {type: String, required: true}
})
const gamesModel = db.model('games', gamesSchema);

const findGameName = async (req, res, next) => {
    const gameId = req.headers['gameid']
    if (!gameId) response(res, 'gameId is required!', 700);
    try {
        const game = await gamesModel.findOne({_id: gameId}).lean().exec()
        req.dbUrl = game.dbUrl
        next()
    }
    catch (err) {
        response(res, 'Game not found', 700);
    }
}
module.exports = findGameName