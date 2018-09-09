const route = require('express').Router(),
    response = require('../../../common/response'),
    auth = require('../../../common/authMiddleware'),
    userGameDataQueryClass = require('./query-class'),
    userGameDataQueryObj = new userGameDataQueryClass('menchman'),
    serviceClass = require('./service-class'),
    serviceClassObj = new serviceClass('menchman')


module.exports = (io) => {
    route.post('/5b39d163afff3d2cf7833f6e/start', async (req, res, next) => {
        const roomId = req.body.roomId
        const players = JSON.parse(req.body.players)
        const roomPlayersWithNames = JSON.parse(req.body.roomPlayersWithNames)
        const gameMeta = JSON.parse(req.body.gameMeta)
        const marketKey = req.body.marketKey
        const methods = require('../../realtime/methods')(io, gameMeta, roomId, marketKey)
        const gameStart = require('./gameStart')(roomId, players, roomPlayersWithNames, methods)
        await gameStart.sendPositions()
    })

    // route.post('/5b39d163afff3d2cf7833f6e/event', async (req, res, next) => {
    //     const roomId = req.body.roomId
    //     const players = JSON.parse(req.body.players)
    //     const gameMeta = JSON.parse(req.body.gameMeta)
    //     const methods = require('../../realtime/methods')(io, gameMeta, roomId)
    //     const gameStart = require('./gameEvents')(roomId, players, methods)
    // })

    route.post('/menchman/buyCastle', auth, async (req, res, next) => {
        if (!req.body.castleNumber) {
            return response(res, "castleNumber required", 1)
        }
        const {name, userId, dbUrl, market} = req.userInfo
        const castleNumber = parseInt(req.body.castleNumber)
        try {
            const unlockedCastles = await serviceClassObj.buyCastle(userId, castleNumber)
            response(res, '', 200, {unlockedCastles: unlockedCastles})
        }
        catch (err) {
            response(res, err.message, err.code)
        }
    })

    route.post('/menchman/selectCastle', auth, async (req, res, next) => {
        if (!req.body.castleNumber) {
            return response(res, "castleNumber required", 1)
        }
        const {name, userId, dbUrl, market} = req.userInfo
        const castleNumber = parseInt(req.body.castleNumber)
        try {
            const selectedCastle = await serviceClassObj.selectCastle(userId, castleNumber)
            response(res, '', 200, {selectedCastle: selectedCastle})
        }
        catch (err) {
            response(res, err.message, err.code)
        }

    })

    route.get('/menchman/getUserGameData', auth, async (req, res, next) => {
        const {name, userId, dbUrl, market} = req.userInfo
        try {
            const userData = await userGameDataQueryObj.getUserData(userId)
            const userInfo = userData.userInfo[0]
            response(res, '', 200, {
                unlockedCastles: userData.unlockedCastles,
                mineLevel: userData.mineLevel,
                capacityLevel: userData.capacityLevel,
                capacity: userData.capacity,
                coinPerHour: userData.coinPerHour,
                userId: userInfo._id,
                coin: userInfo.coin,
                market: userInfo.market,
                name: userInfo.name,
                username: userInfo.username,
                email: userInfo.email
            })
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'Error getting user game data', 31)
        }
    })

    return route
}