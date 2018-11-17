const gameIdentifier = require('../../common/gameIdentifier').findGameName,
    response = require('../../common/response'),
    auth = require('../../common/authMiddleware'),
    router = require('express').Router(),
    serviceClass = require('./class/service-class')

module.exports = () => {

    router.post('/search', auth, async (req, res, next) => {
        const {userId, dbUrl, market} = req.userInfo
        const {username} = req.body
        const serviceObj = new serviceClass(dbUrl, market)
        const user = await serviceObj.searchByUsername(username)
        if (!user)
            response(res, 'User not exist', 2)
        else
            response(res, '', 3, {
                _id: user._id,
                name: user.name,
                username: user.username
            })
    })

    router.post('/addToList', auth, async (req, res, next) => {
        const {userId, dbUrl, market} = req.userInfo
        const {_id} = req.body
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            await serviceObj.addToList(userId, _id)
        }
        catch (e) {

        }

    })

    return router
}
