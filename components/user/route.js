const bcrypt = require('bcrypt');
const query = require('./query');
module.exports = (router) => {
    router.post('/signup', async (req, res, next) => {
        const body = req.body
        const username = body.username
        const password = body.password
        const phoneNumber = body.phoneNumber
        try {
            await query.insertUser(username, password, phoneNumber)
            const token = await jwt.generateJwt({
                username: username,
                password: password
            })
            res.send({token: token})
        }
        catch(err){
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
