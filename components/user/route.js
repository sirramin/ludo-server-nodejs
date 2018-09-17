const gameIdentifier = require('../../common/gameIdentifier').findGameName,
    response = require('../../common/response'),
    auth = require('../../common/authMiddleware'),
    router = require('express').Router(),
    serviceClass = require('./class/service-class')


module.exports = () => {

    router.post('/signup', gameIdentifier, async (req, res, next) => {
        const {username, password, phoneNumber, market} = req.body
        const service = require('./service')(req.dbUrl, market)
        const isUserExists = await service.checkUserExists(username)
        if (isUserExists)
            response(res, 'User already registered')
        else {
            const user = await service.registerUser(username, password, phoneNumber, market)
            response(res, '', 2, user)
        }
    })

    router.post('/signin', gameIdentifier, async (req, res, next) => {
        if (!req.body.username) {
            response(res, "username required", 1)
        }
        if (!req.body.password) {
            response(res, "password required", 2)
        }
        const {username, password} = req.body
        const serviceObj = new serviceClass(req.dbUrl)
        try {
            const token = await serviceObj.signin(username, password)
            response(res, '', 5, {token: token})
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    router.post('/signInAsGuest', gameIdentifier, async (req, res, next) => {
        const {market} = req.body,
            service = require('./service')(req.dbUrl, market),
            tokenAndUserId = await service.registerGuestUser(),
            gameService = require('../logics/' + req.dbUrl + '/service-class'),
            gameServiceObj = new gameService(req.dbUrl)
        await gameServiceObj.insertUserGameData(tokenAndUserId.userId)
        response(res, '', 2, {
            token: tokenAndUserId.token,
            game: req.dbUrl
        })
    })

    router.post('/update', auth, async (req, res, next) => {
        const {userId, dbUrl, market} = req.userInfo
        const {username, password, email, name} = req.body
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const updatedUser = await serviceObj.updateUser(userId, username, password, email, name)
            response(res, '', 5, {
                userId: updatedUser._id,
                name: updatedUser.name,
                username: updatedUser.username,
                email: updatedUser.email
            })
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    /**
     * @api {post} /user/changeName changeName
     * @apiName changeName
     * @apiGroup user
     * @apiHeader {String} gameid
     * @apiParam {String} newName
     * @apiSuccess (Success 2) {String} Name updated
     *
     * @apiError (Errors) 1 new name required
     * @apiError (Errors) 3 error updating name
     */
    router.post('/changeName', auth, async (req, res, next) => {
        if (!req.body.newName) {
            response(res, "new name required", 1)
        }
        const {userId, dbUrl, market} = req.userInfo
        const query = require('./query')(dbUrl)
        const leaderboardService = require('../leaderboard/service')(dbUrl, market)
        const {newName} = req.body
        try {
            const updatedUser = await query.updateUser({_id: userId}, {name: newName})
            await leaderboardService.changeName(newName, userId)
            response(res, 'Name updated to: ' + updatedUser.name, 2)
        }
        catch (e) {
            response(res, 'error updating name', 3)
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
    router.post('/increaseCoin', auth, async (req, res, next) => {
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

    router.post('/forgot', gameIdentifier, async (req, res, next) => {
        if (!req.body.emailOrUsername) {
            return response(res, 'email or Username required', 1)
        }
        const {emailOrUsername} = req.body
        try {
            const serviceObj = new serviceClass(req.dbUrl)
            const userId = await serviceObj.forgot(emailOrUsername)
            return response(res, '', 2, {userId: userId})
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    router.post('/forgot/verifyCode', gameIdentifier, async (req, res, next) => {
        if (!req.body.userId) {
            return response(res, 'userId required', 1)
        }
        if (!req.body.emailCode) {
            return response(res, 'email code required', 1)
        }
        const {userId, emailCode} = req.body
        try {
            const serviceObj = new serviceClass(req.dbUrl)
            await serviceObj.verifyCode(userId, parseInt(emailCode))
            return response(res, '', 2, 'code is correct')
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    router.post('/resetPass', gameIdentifier, async (req, res, next) => {
        if (!req.body.userId) {
            return response(res, 'userId required', 1)
        }
        if (!req.body.newPassword) {
            return response(res, 'email code required', 1)
        }
        if (!req.body.repeat) {
            return response(res, 'repeat required', 1)
        }
        const {userId, newPassword, repeat} = req.body
        try {
            const serviceObj = new serviceClass(req.dbUrl)
            await serviceObj.resetPass(userId, newPassword, repeat)
            return response(res, '', 2, 'Password changed')
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    router.get('/mine/configs', gameIdentifier, async (req, res, next) => {
        try {
            const timestamp = Math.round(new Date().getTime() / 1000)
            const gameMeta = await gameIdentifier.getGameMeta(req.dbUrl)
            return response(res, '', 2, {
                timestamp: timestamp,
                capacityBase: gameMeta.capacityBase,
                capacityStage: gameMeta.capacityStage,
                cphBase: gameMeta.cphBase,
                cphStage: gameMeta.cphStage
            })
        }
        catch (e) {
            response(res, '', 3)
        }
    })


    return router
}
