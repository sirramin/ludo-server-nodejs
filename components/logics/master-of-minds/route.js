const route = require('express').Router(),
    response = require('../../../common/response'),
    auth = require('../../../common/authMiddleware'),
    userGameDataQueryClass = require('./query-class'),
    userGameDataQueryObj = new userGameDataQueryClass('master-of-minds'),
    serviceClass = require('./service-class'),
    serviceClassObj = new serviceClass('master-of-minds')


module.exports = (io) => {

    route.post('/master/updateLevels', auth, async (req, res, next) => {
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