const gameIdentifier = require('../../common/gameIdentifier').findGameName,
    response = require('../../common/response'),
    auth = require('../../common/authMiddleware'),
    router = require('express').Router(),
    serviceClass = require('./class/service-class')

module.exports = () => {

    router.post('/search', gameIdentifier, async (req, res, next) => {
        const {username} = req.body
        const service = require('./service')(req.dbUrl)
        const isUserExists = await service.checkUserExists(username)
        if (!isUserExists)
            response(res, 'User not exist')
        else
            response(res, '', 2)

    })

    return router
}
