const auth = require ('../../common/authMiddleware');
const query = require('./query');
const service = require('./service');
const response = require('./response')
module.exports = (router) => {

    router.get('/getLeaderboard/:operator', async (req, res, next) => {
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
            res.send(err)
        }
    })

    return router
}
