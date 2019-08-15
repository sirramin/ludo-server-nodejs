const response = require('../../common/response'),
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
        if (!req.body.username) {
            response(res, "username required", 1)
        }
        const {userId, dbUrl, market, name} = req.userInfo
        const {username} = req.body
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const friend = await serviceObj.addToList(userId, username, name)
            response(res, 'friend with username ' + friend.username +  ' added to list', 2)
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    router.post('/removeFromList', auth, async (req, res, next) => {
        if (!req.body.username) {
            return response(res, "username required", 1)
        }
        const {userId, dbUrl, market} = req.userInfo
        const {username} = req.body
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const friend = await serviceObj.removeFromList(userId, username)
            response(res, 'friend with username ' + friend.username +  ' removed from list', 2)
        }
        catch (e) {
            response(res, e.message, e.code)
        }
    })

    router.get('/followings', auth, async (req, res, next) => {
        const {userId, dbUrl, market} = req.userInfo
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const followings = await serviceObj.getFollowings(userId)
            response(res, '', 2, followings)
        }
        catch (e) {
            response(res, 'error adding to list', 2)
        }
    })

    return router
}
