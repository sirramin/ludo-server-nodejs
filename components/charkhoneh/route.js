'use strict';
const gameIdentifier = require('../../common/gameIdentifier').findGameName

module.exports = (router) => {
    router.get('/check/:phoneNumber', gameIdentifier, (req, res) => {
        if (!req.params.phoneNumber) {
            response(res, "phoneNumber required", 1)
        }
        const service = require('./service')(req.dbUrl)
        const phoneNumber = req.params.phoneNumber
        service.checkSubscriptionStatus(phoneNumber)
            .then((userInfo) => {
                service.response(res, "", 200, userInfo)
            }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    });


    router.post('/verifySmsCode/', gameIdentifier, async (req, res) => {
        if (!req.body.phoneNumber) {
            return service.response(res, "phoneNumber required", 1)
        }
        if (!req.body.verificationCode) {
            return service.response(res, "verificationCode required", 1)
        }
        const service = require('./service')(req.dbUrl)
        const {phoneNumber, verificationCode} = req.body
        try {
            const userInfo = await service.verifySms(phoneNumber, verificationCode)
            service.response(res, "", 2, userInfo)
        }
        catch (e) {
            logger.error(e)
            service.response(res, 'Code is not valid', 3)

        }
    });

    router.get('/statusAfterLogin/:phoneNumber', gameIdentifier, (req, res) => {
        const phoneNumber = req.params.phoneNumber
        const {name, userId, dbUrl, market} = req.userInfo
        const service = require('./service')(req.dbUrl)
        service.checkStatusAfterLogin(phoneNumber)
            .then((isSubscribed) => {
                service.response(res, "", 200, isSubscribed)
            }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    });


    /**
     * @api {post} /subscription/purchase/verify verify subscription purchase
     * @apiName verify subscription
     * @apiGroup subscription
     *
     * @apiParam {Number} phoneNumber The user phoneNumber
     *
     * @apiSuccess {String} name UserName
     * @apiSuccess {String} coin
     * @apiSuccess {Number} phoneNumber
     * @apiSuccess {Number} tempId
     * @apiSuccess {Number} userId
     */
    router.post('/subscription/verify', gameIdentifier, (req, res) => {
        logger.info(req.body)
        if (!req.body.phoneNumber) {
            return service.response(res, "phoneNumber required", 204)
        }
        if (!req.body.charkhonehToken) {
            return service.response(res, "charkhonehToken required", 204)
        }
        const service = require('./service')(req.dbUrl)
        const {phoneNumber, charkhonehToken} = req.body;
        service.verifySubscriptionPurchase(phoneNumber, charkhonehToken).then((user) => {
            const response = {
                name: user.name,
                coin: user.coin,
                phoneNumber: user.phoneNumber,
                userId: user._id
            }
            service.response(res, "", 200, response)
        }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    });

    router.get('/subscription/cancel/:phoneNumber', (req, res) => {
        logger.info(req.params)
        const phoneNumber = req.params.phoneNumber;
        service.cancelSubscription(phoneNumber).then((user) => {
            service.response(res, "Subscription cancelled", 200)
        }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    });

    router.post('/product/verify', (req, res) => {
        if (!req.body.phoneNumber) {
            return service.response(res, "phoneNumber required", 204)
        }
        if (!req.body.productToken) {
            return service.response(res, "productToken required", 204)
        }
        if(!req.body.productNumber){
            return service.response(res, "product number required", 204)
        }
        const {phoneNumber, productToken, productNumber} = req.body;
        service.verifyProductPurchase(phoneNumber, productToken, productNumber).then((user) => {
            service.response(res, "Product is valid")
        }).catch((err) => {
            service.response(res, err.message, err.statusCode)
        })
    });

    router.post('/api/v1/mtnVas/subscriptionControl', async (req, res) => {
        const {flag, number} = req.body;
        if (!flag || !number) {
            return res.json({'message': 'number and flag are required.'});
        }
        logger.info(`mtn vas called menchman by this number:${number} and  flag:${flag} `);
        const result = await service.upsertUserFromVas(flag, number)
        service.response(res, result.message, 200, result.data)
    });

        return router;
};