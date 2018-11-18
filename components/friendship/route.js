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
        if (!req.body._id) {
            return service.response(res, "_id required", 1)
        }
        const {userId, dbUrl, market} = req.userInfo
        const {_id} = req.body
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const friend = await serviceObj.addToList(userId, _id)
            response(res, 'friend with username ' + friend.username +  ' added to list', 2)
        }
        catch (e) {
            response(res, 'error adding to list', 3)
        }
    })

    router.post('/removeFromList', auth, async (req, res, next) => {
        if (!req.body._id) {
            return service.response(res, "_id required", 1)
        }
        const {userId, dbUrl, market} = req.userInfo
        const {_id} = req.body
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const friend = await serviceObj.removeFromList(userId, _id)
            response(res, 'friend with username ' + friend.username +  ' removed from list', 2)
        }
        catch (e) {
            response(res, 'error removing to list', 3)
        }
    })

    router.get('/friends', auth, async (req, res, next) => {
        const {userId, dbUrl, market} = req.userInfo
        const serviceObj = new serviceClass(dbUrl, market)
        try {
            const user = await serviceObj.getFriends(userId)
            response(res, '', 2, user.friends)
        }
        catch (e) {
            response(res, 'error adding to list', 2)
        }
    })

    return router
}
