const response = require('../../common/response'),
    gameIdentifier = require('../../common/gameIdentifier')


module.exports = (router) => {

    /**
     * @api {get} /otp/check/:phoneNumber Check User
     * @apiName check
     * @apiGroup otp
     * @apiParam {String} phoneNumber
     * @apiSuccess (Success 1) {String} message Code sent
     * @apiSuccess (Success 2) {Object} smsData sms data for sending to confirmation api
     * @apiSuccess (Success 2) {String}  smsData.cpUniqueToken
     * @apiSuccess (Success 2) {String}  smsData.otpTransactionId
     * @apiSuccess (Success 3) {String} message Code sent
     * @apiSuccess (Success 4) {Object} smsData sms data for sending to confirmation api
     * @apiSuccess (Success 4) {String}  smsData.cpUniqueToken
     * @apiSuccess (Success 4) {String}  smsData.otpTransactionId
     *
     * @apiError (Errors) 5 Request sms error
     * @apiError (Errors) 6 Check user db error
     * @apiError (Errors) 7 Check SubscriptionStatus error
     * @apiError (Errors) 8 Get user info error
     * @apiError (Errors) 9 Request login sms error
     * @apiError (Errors) 10 phoneNumber required

     */
    router.get('/check/:phoneNumber', gameIdentifier, async (req, res, next) => {
        if (!req.params.phoneNumber) {
            response(res, "phoneNumber required", 10)
        }
        const service = require('./service')(req.dbUrl)
        const phoneNumber = req.params.phoneNumber
        try {
            const isUserExists = await service.checkUserExists(phoneNumber)
            const isUserSubscribed = await service.checkSubscriptionStatus(phoneNumber)
            if (isUserSubscribed && !isUserExists) {
                await service.addUser(phoneNumber)
                await service.requestLoginSms(phoneNumber)
                response(res, 'Code sent', 1)
            }
            if (!isUserSubscribed && isUserExists) {
                const smsData = await service.requestSms(phoneNumber)
                response(res, '', 2, {smsData: smsData})
            }
            if (isUserSubscribed && isUserExists) {
                await service.requestLoginSms(phoneNumber)
                response(res, 'code sent', 3)
            }
            if (!isUserSubscribed && !isUserExists) {
                await service.addUser(phoneNumber)
                const smsData = await service.requestSms(phoneNumber)
                response(res, '', 4, {smsData: smsData})
            }
        }
        catch (e) {
            response(res, e.message, e.statusCode)
        }
    })


    /**
     * @api {post} /otp/confirmation/:phoneNumber confirmation
     * @apiName confirmation
     * @apiGroup otp
     * @apiParam {Number} phoneNumber
     * @apiParam {String} verificationCode
     * @apiParam {String} cpUniqueToken
     * @apiParam {String} otpTransactionId


     * @apiSuccess (Success 1) {Object} userData user data on database
     * @apiSuccess (Success 1) {String}  userData.name
     * @apiSuccess (Success 1) {String}  userData.userId
     * @apiSuccess (Success 1) {Number}  userData.phoneNumber
     * @apiSuccess (Success 1) {String}  userData.token
     * @apiSuccess (Success 1) {Number}  userData.coin
     *
     * @apiError (Errors) 21 OTP error
     * @apiError (Errors) 22 phoneNumber required
     * @apiError (Errors) 23 verificationCode required
     * @apiError (Errors) 24 Get user info error
     * @apiError (Errors) 25 Code is not valid
     * @apiError (Errors) 26 error adding user
     */
    router.post('/confirmation/:phoneNumber', async (req, res, next) => {
        if (!req.params.phoneNumber) {
            response(res, "phoneNumber required", 22)
        }
        if (!req.body.verificationCode) {
            response(res, "verificationCode required", 23)
        }
        const service = require('./service')(req.dbUrl)
        const phoneNumber = (req.params.phoneNumber).toString()
        const verificationCode = req.body.verificationCode
        const cpUniqueToken = req.body.cpUniqueToken
        const otpTransactionId = req.body.otpTransactionId
        try {
            const result = await service.confirmation(phoneNumber, verificationCode, cpUniqueToken, otpTransactionId)
            response(res, result.message, result.statusCode)
        }
        catch (err) {
            response(res, err.message, err.statusCode)
        }
    })

    return router
}
