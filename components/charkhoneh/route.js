'use strict'
const router = require('express').Router()
const gameIdentifier = require('../../common/gameIdentifier').findGameName

module.exports = () => {

    /**
     * @api {get} /charkhoneh/check/:phoneNumber check charkhoneh subscription
     * @apiName check charkhoneh
     * @apiGroup charkhoneh
     * @apiParam {Number} phoneNumber
     * @apiSuccess (Success 2) {String} name
     * @apiSuccess (Success 2) {Number} coin
     * @apiSuccess (Success 2) {Number} phoneNumber
     * @apiSuccess (Success 2) {String} token
     * @apiSuccess (Success 2) {String} userId
     * @apiError (Errors) 1 phoneNumber required
     * @apiError (Errors) 3 User not exist
     * @apiError (Errors) 4 User has no subscription history
     * @apiError (Errors) 5 Subscription expired
     * @apiError (Errors) 6 User cancelled subscription
     * @apiError (Errors) 7 Subscription is not valid
     * @apiError (Errors) 8 problem verifying subscription
     * @apiError (Errors) 9 vas sms error
     */
    router.get('/check/:phoneNumber', gameIdentifier, (req, res) => {
        const service = require('./service')(req.dbUrl)
        if (!req.params.phoneNumber) {
            service.response(res, "phoneNumber required", 1)
        }
        const phoneNumber = req.params.phoneNumber

        const argv = process.argv.slice(2)
        logger.info('argv: ' + argv)
        if (argv[0] === 'platform-Master' && !schedulerExecuted)
            require('./coin-scheduler')(req.dbUrl)

        service.checkSubscriptionStatus(phoneNumber)
            .then((userInfo) => {
                service.response(res, "", 2, userInfo)
            }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    })

    /**
     * @api {post} /charkhoneh/verifySmsCode verify sms
     * @apiName verify sms
     * @apiGroup charkhoneh
     * @apiParam {Number} phoneNumber
     * @apiParam {Number} verificationCode
     * @apiSuccess (Success 2) {String} name
     * @apiSuccess (Success 2) {Number} coin
     * @apiSuccess (Success 2) {Number} phoneNumber
     * @apiSuccess (Success 2) {String} token
     * @apiSuccess (Success 2) {String} userId
     * @apiError (Errors) 1 phoneNumber required
     * @apiError (Errors) 3 verificationCode required
     * @apiError (Errors) 4 Code is not valid
     */
    router.post('/verifySmsCode', gameIdentifier, async (req, res) => {
        logger.info(req.body)
        const service = require('./service')(req.dbUrl)
        if (!req.body.phoneNumber) {
            return service.response(res, "phoneNumber required", 1)
        }
        if (!req.body.verificationCode) {
            return service.response(res, "verificationCode required", 2)
        }
        const {phoneNumber, verificationCode} = req.body
        try {
            const userInfo = await service.verifySms(phoneNumber, verificationCode)
            service.response(res, "", 3, userInfo)
        }
        catch (e) {
            logger.error(e)
            service.response(res, 'Code is not valid', 4)
        }
    })

    /**
     * @api {get} /charkhoneh/statusAfterLogin/:phoneNumber status After Login
     * @apiName status After Login
     * @apiGroup charkhoneh
     * @apiParam {Number} phoneNumber
     * @apiSuccess (Success 2) {Boolean} isSubscribed
     * @apiSuccess (Success 2) {Number} coin
     * @apiError (Errors) 1 phoneNumber required
     * @apiError (Errors) 3 Error checking status
     */
    router.get('/statusAfterLogin/:phoneNumber', gameIdentifier, (req, res) => {
        const service = require('./service')(req.dbUrl)
        if (!req.params.phoneNumber) {
            return service.response(res, "phoneNumber required", 1)
        }
        const phoneNumber = req.params.phoneNumber
        service.checkStatusAfterLogin(phoneNumber)
            .then((isSubscribed) => {
                service.response(res, "", 2, isSubscribed)
            }).catch((err) => {
            service.response(res, 'Error checking status', 3)
        })
    })


    /**
     * @api {post} /charkhoneh/subscription/verify verifying subscription
     * @apiName verifying subscription
     * @apiGroup charkhoneh
     * @apiParam {Number} phoneNumber
     * @apiParam {Number} charkhonehToken
     * @apiSuccess (Success 2) {String} name
     * @apiSuccess (Success 2) {Number} coin
     * @apiSuccess (Success 2) {Number} phoneNumber
     * @apiSuccess (Success 2) {String} token
     * @apiSuccess (Success 2) {String} userId
     * @apiError (Errors) 1 phoneNumber required
     * @apiError (Errors) 3 charkhonehToken required
     * @apiError (Errors) 10 problem verifying subscription
     * @apiError (Errors) 11 problem verifying subscription
     * @apiError (Errors) 12 Subscription is not valid
     */
    router.post('/subscription/verify', gameIdentifier, (req, res) => {
        const service = require('./service')(req.dbUrl)
        if (!req.body.phoneNumber) {
            return service.response(res, "phoneNumber required", 1)
        }
        if (!req.body.charkhonehToken) {
            return service.response(res, "charkhonehToken required", 3)
        }
        const {phoneNumber, charkhonehToken} = req.body
        service.verifySubscriptionPurchase(phoneNumber, charkhonehToken).then((user) => {
            const response = {
                name: user.name,
                coin: user.coin,
                phoneNumber: user.phoneNumber,
                userId: user._id,
                token:  user.token
            }
            service.response(res, "", 2, response)
        }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    })

    /**
     * @api {get} /charkhoneh/subscription/cancel/:phoneNumber cancel subscription
     * @apiName cancel subscription
     * @apiGroup charkhoneh
     * @apiParam {Number} phoneNumber
     * @apiSuccess (Success 2) {String} Subscription cancelled
     * @apiError (Errors) 1 phoneNumber required
     * @apiError (Errors) 13 Error requesting charkhoneh
     */
    router.get('/subscription/cancel/:phoneNumber', gameIdentifier, (req, res) => {
        const service = require('./service')(req.dbUrl)
        if (!req.params.phoneNumber) {
            return service.response(res, "phoneNumber required", 1)
        }
        const phoneNumber = req.params.phoneNumber
        service.cancelSubscription(phoneNumber).then((user) => {
            service.response(res, "Subscription cancelled", 2)
        }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    })

    router.post('/product/verify', gameIdentifier, (req, res) => {
        const service = require('./service')(req.dbUrl)
        if (!req.body.phoneNumber) {
            return service.response(res, "phoneNumber required", 1)
        }
        if (!req.body.productToken) {
            return service.response(res, "productToken required", 2)
        }
        if(!req.body.productNumber){
            return service.response(res, "product number required", 3)
        }
        const {phoneNumber, productToken, productNumber} = req.body
        service.verifyProductPurchase(phoneNumber, productToken, productNumber).then((user) => {
            service.response(res, "Product is valid")
        }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    })

    router.post('/subscriptionControl', gameIdentifier, async (req, res) => {
        const service = require('./service')(req.dbUrl)
        const {flag, number} = req.body
        if (!flag || !number) {
            return res.json({'message': 'number and flag are required.'})
        }
        logger.info(`mtn vas called menchman by this number:${number} and  flag:${flag} `)
        const result = await service.upsertUserFromVas(flag, number)
        service.response(res, result.message, 200, result.data)
    })

        return router
}