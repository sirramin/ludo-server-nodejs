const auth = require('../../common/authMiddleware');
// const query = require('./query');
const service = require('./service');
const response = require('../../common/response')
module.exports = (router) => {

    router.get('/:operator', auth, async (req, res) => {
        const {username} = req.userInfo
        try {
            const leaders = await service.getLeaderboard(username)
            response(res, '', 200, {leaders: leaders})
        }
        catch (err) {
            res.send(err)
        }
    })

    router.post('/gameResult', auth, async (req, res) => {
        const league = req.body.league
        const isWinner = req.body.isWinner
        const userInfo = req.userInfo
        try {
            await service.addScore(userInfo.username, league, isWinner)
            response(res, 'score added')
        }
        catch (err) {
            response(res, 'error adding score', 1001)
        }
    })

    return router
}
