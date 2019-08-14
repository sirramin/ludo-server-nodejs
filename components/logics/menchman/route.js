const route = require('express').Router(),
    response = require('../../../common/response'),
    auth = require('../../../common/authMiddleware'),
    userGameDataQueryClass = require('./query-class'),
    userGameDataQueryObj = new userGameDataQueryClass('menchman'),
    serviceClass = require('./service-class'),
    serviceClassObj = new serviceClass('menchman')


module.exports = () => {

    route.post('/buyCastle', auth, async (req, res, next) => {
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

    route.post('/selectCastle', auth, async (req, res, next) => {
        if (!req.body.castleNumber) {
            return response(res, "castleNumber required", 1)
        }
        const {name, userId, dbUrl, market} = req.userInfo
        const castleNumber = parseInt(req.body.castleNumber)
        try {
            const selectedCastle = await serviceClassObj.selectCastle(userId, castleNumber, market)
            response(res, '', 200, {selectedCastle: selectedCastle})
        }
        catch (err) {
            response(res, err.message, err.code)
        }
    })

    route.get('/getUserGameData', auth, async (req, res, next) => {
        const {name, userId, dbUrl, market} = req.userInfo
        try {
            const userData = await userGameDataQueryObj.getUserData(userId)
            const userInfo = userData.userInfo[0]
            response(res, '', 200, {
                unlockedCastles: userData.unlockedCastles,
                selectedCastle: userData.selectedCastle,
                cphLevel: userData.cphLevel,
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

    route.post('/updateLevels', auth, async (req, res, next) => {
        const {name, userId, dbUrl, market} = req.userInfo
        if (!req.body.level) {
            return response(res, 'capacityLevel or cphLevel are required', 1)
        }
        try {
            const serviceObj = new serviceClass(dbUrl)
            await serviceObj.updateLevels(req.body.level, userId)
            return response(res, '', 2, 'level increased')
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    return route
}