const gameIdentifier = require('../../common/gameIdentifier').findGameName,
    response = require('../../common/response'),
     auth = require('../../common/authMiddleware')


module.exports = (router) => {
    router.post('/signup', gameIdentifier, async (req, res, next) => {
        const service = require('./service')(req.dbUrl)
        const {username, password, phoneNumber, market} = req.body
        const isUserExists = await service.checkUserExists(username)
        if (isUserExists)
            response(res, 'User already registered')
        else {
            const user = await service.registerUser(username, password, phoneNumber, market)
            response(res, '', 2, user)
        }
    })

    router.post('/signin', async (req, res, next) => {

    })

    router.post('/signInAsGuest', async (req, res, next) => {
        const service = require('./service')(req.dbUrl)
        const {market} = req.body
        const guest = await service.registerGuestUser(market)
        response(res, '', 2, guest)

    })

    router.put('/update', async (req, res, next) => {

    })

    /**
     * @api {put} /user/changeName changeName
     * @apiName changeName
     * @apiGroup user
     * @apiHeader {String} gameid
     * @apiParam {String} newName
     * @apiSuccess (Success 2) {String} Name updated
     *
     * @apiError (Errors) 1 new name required
     * @apiError (Errors) 3 error updating name
     */
    router.put('/changeName', auth, async (req, res, next) => {
        if (!req.body.newName) {
            response(res, "new name required", 1)
        }
        const {userId, dbUrl} = req.userInfo
        const query = require('./query')(dbUrl)
        const {newName} = req.body
        try {
            await query.updateUser({_id: userId}, {name: newName})
            response(res, 'Name updated ', 2)
        }
        catch (e) {
            response(res, 'error updating name', 3)
        }
    })

    router.put('/increaseCoin', auth, async (req, res, next) => {
        if (!req.body.coin) {
            response(res, "new name required", 1)
        }
        const {userId, dbUrl} = req.userInfo
        const query = require('./query')(dbUrl)
        const {newName} = req.body
        await query.updateUser({_id: userId}, {name: newName})
        response(res, 'Name updated', 2)
    })


    return router
}
