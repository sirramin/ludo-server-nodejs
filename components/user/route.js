// const bcrypt = require('bcryptjs');
const jwt = require('../../common/jwt')
const query = require('./query');
module.exports = (router) => {
    router.post('/signup', async (req, res, next) => {
        const {username, password, phoneNumber, market, gameId} = req.body
        const name = 'user' + _.random(1, 99999)
        try {
            const user = await query.insertUser(username, password, phoneNumber, name, market)
            const token = await jwt.generateJwt()
            res.send({token: token})
        }
        catch (err) {
            res.send(err)
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
