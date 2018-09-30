const route = require('express').Router(),
    response = require('../../../common/response'),
    auth = require('../../../common/authMiddleware'),
    userGameDataQueryClass = require('./query-class'),
    userGameDataQueryObj = new userGameDataQueryClass('menchman'),
    serviceClass = require('./service-class'),
    serviceClassObj = new serviceClass('menchman')


module.exports = (io) => {

    route.get('/moogy/getHintsCount', auth, async (req, res, next) => {
        const {name, userId, dbUrl, market} = req.userInfo
        try {
            const userData = await userGameDataQueryObj.getUserData(userId)
            const hints = userData.userInfo[0]
            response(res, '', 200, {
                hints: hints
            })
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'Error getting user game data', 31)
        }
    })

    /**
     * @api {post} /user/increaseCoin increase coin
     * @apiName increaseCoin
     * @apiGroup user
     * @apiHeader {String} gameid
     * @apiParam {Number} coin
     * @apiSuccess (Success 2) {Number} newCoin
     *
     * @apiError (Errors) 1 coin required
     * @apiError (Errors) 3 error updating coin
     */
    route.post('/increaseHint', auth, async (req, res, next) => {
        if (!req.body.coin) {
            logger.error('coin required')
            return response(res, "coin required", 1)
        }
        const {userId, dbUrl} = req.userInfo
        const query = require('./query')(dbUrl)
        const {coin} = req.body
        try {
            const updatedUser = await query.updateUser({_id: userId}, {$inc: {coin: coin}})
            logger.info('coin updated to' + updatedUser.coin)
            return response(res, '', 2, {"newCoin": updatedUser.coin})
        }
        catch (e) {
            logger.error(e)
            response(res, 'error updating coin', 3)
        }
    })

    return route
}