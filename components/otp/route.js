const service = require('./service'),
    response = require('../../common/response')
jwt = require('../../common/jwt');
module.exports = (router) => {

    router.post('/check/:phoneNumber', async (req, res, next) => {
        const phoneNumber = req.params.phoneNumber
        try {
            const isUserExists = await service.checkUserExists(phoneNumber)
            const isUserSubscribed = await service.checkSubscriptionStatus(phoneNumber)
            let userData, smsData, statusCode;
            if (isUserSubscribed && !isUserExists) {
                userData = await service.insertUser(phoneNumber)
                statusCode = 210
            }
            if (!isUserSubscribed && isUserExists) {
                smsData = await service.requestSms(phoneNumber)
                userData = await service.getUserInfo(phoneNumber)
                statusCode = 211
            }
            if (isUserSubscribed && isUserExists) {
                smsData = await service.requestSms(phoneNumber)
                userData = await service.getUserInfo(phoneNumber)
                statusCode = 212
            }
            if (!isUserSubscribed && !isUserExists) {
                userData = await service.insertUser(phoneNumber)
                smsData = await service.requestSms(phoneNumber)
                statusCode = 213
            }
            response(res, '', statusCode, {
                userData: userData,
                smsData: smsData
            })
        }
        catch (e) {
            response(res, e.message, e.statusCode)
        }
    })

    router.get('/confirmation/:phoneNumber', async (req, res, next) => {
        const phoneNumber = req.params.phoneNumber
        const verificationCode = req.body.verificationCode
        const cpUniqueToken = req.body.cpUniqueToken
        const otpTransactionId = req.body.otpTransactionId
        try {
            const result = await service.confirmation(phoneNumber, verificationCode, cpUniqueToken, otpTransactionId)
        }
        catch (err) {
            response(res, e.message, e.statusCode)
        }
    })

    return router
}
