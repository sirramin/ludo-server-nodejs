const gameIdentifier = require('../../common/gameIdentifier').findGameName,
    response = require('../../common/response')


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

    router.post('/signin', function (req, res, next) {

    })

    router.post('/signinasguest', function (req, res, next) {

    })

    router.put('/update', function (req, res, next) {

    })

    return router
}
