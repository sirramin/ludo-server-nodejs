const {mongooseClient, connections} = require('./mongoose-client')('arta-game-platform')
const response = require('./response')
const gamesSchema = new mongooseClient.Schema({
    name: {type: String, required: true}
})
const gamesModel = connections['arta-game-platform'].model('games', gamesSchema);

const findGameName = async (req, res, next) => {
    const gameId = req.headers['gameid']
    if (!gameId) response(res, 'gameId is required!', 700);
    try {
        const gameMeta = await gamesModel.findOne({_id: gameId}).lean().exec()
        req.dbUrl = gameMeta.dbUrl
        next()
    }
    catch (err) {
        response(res, 'Game not found', 700);
    }
}

const getGameMeta = async (dbUrl) => {
    return gameMeta = await gamesModel.findOne({dbUrl: dbUrl}).lean().exec()
}

module.exports = {
    findGameName: findGameName,
    getGameMeta: getGameMeta
}