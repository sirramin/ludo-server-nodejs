const route = require('express').Router(),
    response = require('../../../common/response'),
    auth = require('../../../common/authMiddleware'),
    userGameDataQueryClass = require('./query-class'),
    userGameDataQueryObj = new userGameDataQueryClass('moogy'),
    serviceClass = require('./service-class'),
    serviceClassObj = new serviceClass('moogy')


module.exports = (io) => {

    /**
     * @api {get} /moogy/getHintsCount get hints count
     * @apiName getHintsCount
     * @apiGroup moogy
     * @apiHeader {String} token
     * @apiSuccess (Success 2) {Number} hints
     *
     * @apiError (Errors) 3 Error getting user hints
     */
    route.get('/getHintsCount', auth, async (req, res, next) => {
        const {name, userId, dbUrl, market} = req.userInfo
        try {
            const userData = await userGameDataQueryObj.queryHintsCount(userId)
            response(res, '', 2, {
                hints: userData.hints
            })
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'Error getting user hints', 3)
        }
    })

    /**
     * @api {post} /moogy/increaseHint increase hints
     * @apiName increaseHint
     * @apiGroup moogy
     * @apiHeader {String} token
     * @apiParam {Number} hints
     * @apiSuccess (Success 2) {Number} newHints
     *
     * @apiError (Errors) 1 hints required
     * @apiError (Errors) 3 error updating hints
     */
    route.post('/increaseHint', auth, async (req, res, next) => {
        if (!req.body.hints) {
            return response(res, "hints required", 1)
        }
        const {userId} = req.userInfo
        const {hints} = req.body
        try {
            const updatedUserData = await userGameDataQueryObj.updateHints({_id: userId}, {$inc: {hints: hints}})
            logger.info('hint updated to' + updatedUserData.hints)
            return response(res, '', 2, {"newHints": updatedUserData.hints})
        }
        catch (e) {
            logger.error(e)
            response(res, 'error updating hints', 3)
        }
    })

    return route
}