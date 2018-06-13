const service = require('./service');
const jwt = require ('../../common/jwt');
module.exports = (router) => {

    router.get('/check/:phoneNumber', async (req, res, next) => {
        const phoneNumber = req.params.phoneNumber
        try {
            await service.checkUserExists(phoneNumber)
            const token = await jwt.generateJwt({
                phoneNumber: phoneNumber
            })
            res.send({token: token})
        }
        catch (err) {
            res.send(err)
        }
    })

    router.post('/confirmation', function (req, res, next) {

    })


    return router
}
