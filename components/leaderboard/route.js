const auth = require('../../common/authMiddleware');
// const query = require('./query');
const service = require('./service');
const response = require('../../common/response')
module.exports = (router) => {


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
        const {name, userId} = req.userInfo
        try {
            const leaders = await service.getLeaderboard(name, userId)
            response(res, '', 200, {leaders: leaders})
        }
        catch (err) {
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
        const league = req.body.league
        const isWinner = req.body.isWinner
        const userInfo = req.userInfo
        try {
            await service.addScore(userInfo, league, isWinner)
            response(res, 'score added', 40)
        }
        catch (err) {
            response(res, 'error adding score', 41)
        }
    })

    return router
}
