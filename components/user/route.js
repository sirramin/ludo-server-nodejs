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

    router.post('/signin', async (req, res, next) => {

    })

    router.post('/signInAsGuest', async (req, res, next) => {
        const service = require('./service')(req.dbUrl)
        const {market} = req.body
        const guest = await service.registerGuestUser(market)
        response(res, '', 2, guest)

    })

    router.put('/update', function (req, res, next) {

    })

    router.put('/changeName', function (req, res, next) {
        const service = require('./service')(req.dbUrl)
        const {userId} = req.userInfo
        const {newName} = req.body
        service.updateUser({_id: userId}, {name: newName})
    })


    return router
}
