const service = require('./service'),
    response = require('../../common/response')
jwt = require('../../common/jwt');
module.exports = (router) => {

    /**
     * @api {get} /otp/check/:phoneNumber Check User
     * @apiName check
     * @apiGroup otp
     * @apiParam {Number} phoneNumber phone number.

     * @apiSuccess (Success 1) {Object} userData user data on database
        * @apiSuccess (Success 1) {String}  userData.name
        * @apiSuccess (Success 1) {String}  userData.userId
        * @apiSuccess (Success 1) {Number}  userData.phoneNumber
        * @apiSuccess (Success 1) {String}  userData.token
        * @apiSuccess (Success 1) {Number}  userData.coin

     * @apiSuccess (Success 2) {Object} smsData sms data for sending to confirmation aip
        * @apiSuccess (Success 2) {String}  smsData.cpUniqueToken
        * @apiSuccess (Success 2) {String}  smsData.otpTransactionId
     * @apiSuccess (Success 2) {Object} userData

     * @apiSuccess (Success 3) {Object} userData

     * @apiSuccess (Success 4) {Object} userData
     * @apiSuccess (Success 4) {Object} smsData
     *
     * @apiError (Errors) 5 Request sms error
     * @apiError (Errors) 6 Check user db error
     * @apiError (Errors) 7 Check SubscriptionStatus error
     * @apiError (Errors) 8 Get user info error

     */
    router.get('/check/:phoneNumber', async (req, res, next) => {
        if (!req.body.phoneNumber) {
            response(res, "phoneNumber required", 1)
        }
        const phoneNumber = req.params.phoneNumber
        try {
            const isUserExists = await service.checkUserExists(phoneNumber)
            const isUserSubscribed = await service.checkSubscriptionStatus(phoneNumber)
            let userData, smsData, statusCode;
            if (isUserSubscribed && !isUserExists) {
                userData = await service.insertUser(phoneNumber)
                await service.requestSms2(phoneNumber)
                statusCode = 1
            }
            if (!isUserSubscribed && isUserExists) {
                userData = await service.getUserInfo(phoneNumber)
                smsData = await service.requestSms(phoneNumber)
                statusCode = 2
            }
            if (isUserSubscribed && isUserExists) {
                userData = await service.getUserInfo(phoneNumber)
                await service.requestSms2(phoneNumber)
                statusCode = 3
            }
            if (!isUserSubscribed && !isUserExists) {
                userData = await service.insertUser(phoneNumber)
                smsData = await service.requestSms(phoneNumber)
                statusCode = 4
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


    /**
     * @api {post} /otp/confirmation/:phoneNumber Check User
     * @apiName confirmation
     * @apiGroup otp
     * @apiParam {Number} phoneNumber
     * @apiParam {String} verificationCode
     * @apiParam {String} cpUniqueToken
     * @apiParam {String} otpTransactionId


     * @apiSuccess (Success 9) {String} message Successfully registered
     *
     * @apiError (Errors) 10 confirmation OTP error

     */
    router.post('/confirmation/:phoneNumber', async (req, res, next) => {
        const phoneNumber = req.params.phoneNumber
        const verificationCode = req.body.verificationCode
        const cpUniqueToken = req.body.cpUniqueToken
        const otpTransactionId = req.body.otpTransactionId
        try {
            const result = await service.confirmation(phoneNumber, verificationCode, cpUniqueToken, otpTransactionId)
            response(res, result.message, result.statusCode)
        }
        catch (err) {
            response(res, e.message, e.statusCode)
        }
    })

    return router
}
