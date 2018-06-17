const auth = require ('../../common/authMiddleware');
// const query = require('./query');
const service = require('./service');
const response = require('../../common/response')
module.exports = (router) => {

    router.get('/:operator', async (req, res, next) => {
        try {
            await service.getLeaderboard()
            response(res, '', 200, {token: token})
        }
        catch(err){
            res.send(err)
        }
    })

    router.post('/gameResult', async (req, res, next) => {
        // const userId = req.headers.id
        try {
            await service.addScore()
            response(res, 'score added')
        }
        catch(err){
            response(res, 'error adding score', 1001)
        }
    })

    return router
}
