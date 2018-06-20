const auth = require('../../common/authMiddleware');
// const query = require('./query');
const service = require('./service');
const response = require('../../common/response')
module.exports = (router) => {

    router.get('/:operator', auth, async (req, res) => {
        const {userId} = req.userInfo
        try {
            const leaders = await service.getLeaderboard(userId)
            response(res, '', 200, {leaders: leaders})
        }
        catch (err) {
            res.send(err)
        }
    })

    router.post('/gameResult', async (req, res) => {
        const league = req.body.league
        const isWinner = req.body.isWinner
        const userInfo = req.userInfo
        try {
            await service.addScore(userInfo, league, isWinner)
            response(res, 'score added')
        }
        catch (err) {
            response(res, 'error adding score', 1001)
        }
    })

    return router
}
