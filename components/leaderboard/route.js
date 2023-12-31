const auth = require('../../middleware/authMiddleware')
const response = require('../../common/response')
const router = require('express').Router()
const serviceClass = require('./class/service-class')


// const textbox = require('textbox')
module.exports = () => {


    /**
     * @api {get} /leaderboard/:operator Get leaderboard
     * @apiName getLeaderboard
     * @apiGroup leaderboard
     * @apiHeader {String} token
     * @apiParam {String} operator

     @apiSuccessExample {json} Success-Response:
     {
    "code": 200,
    "message": "",
    "data": {
        "leaders": {
            "top20": [
                {
                    "rank": 1,
                    "member": {
                        "name": "user78927",
                        "userId": "5b31dc0de49297286b2df397",
                        "win": 1,
                        "lose": 0
                    },
                    "score": 10
                }
            ],
            "middleRanks": [
                {
                    "rank": 14,
                    "member": {
                        "name": "user78927",
                        "userId": "5b31dc0de49297286b2df397",
                        "win": 1,
                        "lose": 0
                    },
                    "score": 4
                }
            ]
        }
    }
}
     *
     * @apiError (Errors) 31 Error getting leaderboard
     */
    router.get('/:operator', auth, async (req, res) => {
        const {name, userId, dbUrl, market} = req.userInfo
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const leaders = await serviceObj.getLeaderboard(name, userId)
            // text box
            response(res, '', 200, {leaders: leaders})
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'Error getting leaderboard', 31)
        }
    })

    router.get('/old/:operator', auth, async (req, res) => {
        const {name, userId, dbUrl, market} = req.userInfo
        const service = require('./service')(dbUrl, market)
        try {
            const leaders = await service.getLeaderboard(name, userId)
            // text box
            response(res, '', 200, {leaders: leaders})
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'Error getting leaderboard', 31)
        }
    })


    /**
     * @api {post} /gameResult send game result
     * @apiName gameResult
     * @apiGroup leaderboard
     * @apiHeader {String} token
     * @apiParam {Number} league
     * @apiParam {Boolean} isWinner
     * @apiSuccess (Success 40) {String} message score added
     * @apiError (Errors) 41 error adding score
     */

    router.post('/gameResult', auth, async (req, res) => {
        const {name, userId, dbUrl, market} = req.userInfo
        const service = require('./service')(dbUrl, market)
        const {league, isWinner}  = req.body
        try {
            await service.addScore(name, userId, league, isWinner)
            response(res, 'score added', 40)
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'error adding score', 41)
        }
    })

    router.get('/leagues', auth, async (req, res) => {
        const {name, userId, dbUrl, market} = req.userInfo
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const leagues = await serviceObj.getLeagues()
            response(res, '', 200, {leagues: leagues})
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'Error getting leagues', 31)
        }
    })

    router.post('/fakeUsers', async (req, res) => {
        const {dbUrl, market}  = req.body
        const fakeUsers = require('./fakeUsers')(dbUrl, market)
        try {
            await fakeUsers.addFakes()
            response(res, 'fakes added', 40)
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'error adding fakes', 41)
        }
    })

    router.post('/removeFakes', async (req, res) => {
        const {dbUrl, market}  = req.body
        const fakeUsers = require('./fakeUsers')(dbUrl, market)
        try {
            await fakeUsers.removeFakes()
            response(res, 'fakes removed', 40)
        }
        catch (err) {
            logger.error(err.message)
            response(res, 'error removing fakes', 41)
        }
    })

    return router
}
