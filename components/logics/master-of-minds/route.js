const route = require('express').Router(),
    response = require('../../../common/response'),
    auth = require('../../../common/authMiddleware'),
    userGameDataQueryClass = require('./query-class'),
    userGameDataQueryObj = new userGameDataQueryClass('master-of-minds'),
    serviceClass = require('./service-class'),
    serviceClassObj = new serviceClass('master-of-minds')


module.exports = () => {

    route.get('/getUserGameData', auth, async (req, res, next) => {
        const {name, userId, dbUrl, market} = req.userInfo
        try {
            const userData = await userGameDataQueryObj.getUserData(userId)
            const userInfo = userData.userInfo[0]
            response(res, '', 200, {
                powerUps: userData.powerUps,
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

    route.post('/powerUp/increaseOne', auth, async (req, res, next) => {
        const {name, userId, dbUrl, market} = req.userInfo
        if (!req.body.powerUpCode) {
            return response(res, 'powerUpCode is required', 1)
        }
        try {
            const powerUpCode = parseInt(req.body.powerUpCode)
            const serviceObj = new serviceClass(dbUrl)
            await serviceObj.updatePowerUps(powerUpCode, userId)
            return response(res, '', 2, 'powerUp increased')
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    route.post('/powerUp/multipleDecrease', auth, async (req, res, next) => {
        const {name, userId, dbUrl, market} = req.userInfo
        if (!req.body.powerUpArray) {
            return response(res, 'powerUpArray is required', 1)
        }
        try {
            const powerUpArray = JSON.parse(req.body.powerUpArray)
            const serviceObj = new serviceClass(dbUrl)
            await serviceObj.decreasePowerUps(powerUpArray, userId)
            return response(res, '', 2, 'powerUps decreased')
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    return route
}