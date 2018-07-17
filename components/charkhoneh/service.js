const rpn = require('request-promise-native'),
    jwt = require('../../common/jwt'),
    _ = require('lodash')

module.exports = (dbUrl) => {
    const jhoobinConfig = require('./config')[dbUrl].jhoobin,
        query = require('./query')(dbUrl),
        sendCode = require('./sendSms')(dbUrl),
        jhoobinBaseUrl = jhoobinConfig.url + jhoobinConfig.packageName + '/purchases/subscriptions/' + jhoobinConfig.sku + '/tokens/',
        jhoobinBaseUrlProducts = jhoobinConfig.url + jhoobinConfig.packageName + '/purchases/products/'

    if (!schedulerExecuted)
        require('./coin-scheduler')(dbUrl)

    const checkSubscriptionStatus = (phoneNumber) => {
        const verificationCode = _.random(10000, 99999)
        return query.findByPhoneNumber(phoneNumber)
            .then((user) => {
                return userStatus(user)
            })
            .then((charkhonehToken) => {
                return checkStatusFromCharkhoneh(phoneNumber, charkhonehToken)
            })
            .then(() => {
                return query.updateVerifyCode(phoneNumber, verificationCode)
            })
            .then(() => {
                return sendSms(phoneNumber, verificationCode)
            })
            .then(() => {
                return query.findByPhoneNumber(phoneNumber)
            })
    }

    const checkStatusAfterLogin = (phoneNumber) => {
        let coin
        return query.findByPhoneNumber(phoneNumber)
            .then((user) => {
                coin = user.coin
                return userStatus(user)
            })
            .then((charkhonehToken) => {
                return checkStatusFromCharkhoneh(phoneNumber, charkhonehToken)
            })
            .then(() => {
                return {
                    "isSubscribed": true,
                    "coin": coin
                }
            })
    }

    const userStatus = (user) => {
        const currentTime = new Date().getTime()
        return new Promise((resolve, reject) => {
            if (!user)
                reject({message: 'User not exist', statusCode: 404})
            if (!user.charkhonehHistory.length)
                reject({message: 'User has no subscription history', statusCode: 405})

            const lastSubscription = user.charkhonehHistory[user.charkhonehHistory.length - 1]
            if (lastSubscription.expiryTimeMillis < currentTime)
                reject({message: 'Subscription expired', statusCode: 406})
            if (user.charkhonehCancelled)
                reject({message: 'User cancelled subscription', statusCode: 407})
            resolve(lastSubscription.charkhonehToken)
        })
    }

    const checkStatusFromCharkhoneh = (phoneNumber, charkhonehToken) => {
        const jhoobinVerify = {
            uri: jhoobinBaseUrl + charkhonehToken + '?access_token=' + jhoobinConfig.accessToken,
            json: true
        }
        const currentTime = new Date().getTime()
        return new Promise((resolve, reject) => {
            rpn(jhoobinVerify)
                .then((subscriptionDetails) => {
                    if (subscriptionDetails.autoRenewing && subscriptionDetails.paymentState && subscriptionDetails.expiryTimeMillis >= currentTime)
                        resolve()
                    else
                        reject({message: 'Subscription is not valid', statusCode: 408})
                })
                .catch(err => {
                    reject({message: 'problem verifying subscription', statusCode: 502})
                })
        })
    }

    const sendSms = (phoneNumber, verificationCode) => {
        const smsData = {
            phoneNumber: phoneNumber,
            content: verificationCode,
            market: "MTN"
        }

        return new Promise((resolve, reject) => {
            sendCode.sendVerificationCodeByVas(smsData)
                .then(() => {
                    logger.info('sms sent')
                    resolve()
                })
                .catch(err => {
                    logger.error('vas sms error' + err)
                    reject({message: 'vas sms error', statusCode: 504})
                })
        })
    }

    const verifySubscriptionPurchase = (phoneNumber, charkhonehToken) => {
        const jhoobinVerify = {
            uri: jhoobinBaseUrl + charkhonehToken + '?access_token=' + jhoobinConfig.accessToken,
            json: true
        }
        const currentTime = new Date().getTime()
        return new Promise((resolve, reject) => {
            rpn(jhoobinVerify)
                .catch(err => {
                    reject({message: 'problem verifying subscription', statusCode: 502})
                })
                .then((subscriptionDetails) => {
                    if (subscriptionDetails.autoRenewing && subscriptionDetails.paymentState && subscriptionDetails.expiryTimeMillis >= currentTime) {
                        query.upsertCharkhonehHistory(phoneNumber, subscriptionDetails, charkhonehToken)
                            .then(user => {
                                resolve(user)
                            }).catch(err => {
                            logger.error('database error: ' + err)
                            reject({message: 'problem verifying subscription', statusCode: 502})
                        })
                    }
                    else
                        reject({message: 'Subscription is not valid', statusCode: 408})
                })
        })
    }

    const cancelSubscription = (phoneNumber) => {
        return query.findByPhoneNumber(phoneNumber)
            .then((user) => {
                return userErrors(user)
                    .then((user) => {
                        const lastSubscription = user.charkhonehHistory[user.charkhonehHistory.length - 1]
                        const jhoobinCancel = jhoobinBaseUrl + lastSubscription.charkhonehToken + ':cancel?access_token=' + jhoobinConfig.accessToken
                        return new Promise((resolve, reject) => {
                            rpn(jhoobinCancel)
                                .then((cancelDetails) => {
                                    if (cancelDetails)
                                        query.findUserAndCancel(phoneNumber).then(user => {
                                            resolve()
                                        })
                                }).catch((err) => {
                                reject({message: 'Error requesting charkhoneh', statusCode: 503})
                            })
                        })
                    })
            })
    }

    const userErrors = ((user) => {
        return new Promise((resolve, reject) => {
            if (!user)
                reject({message: 'user not exists', statusCode: 404})
            const lastSubscription = user.charkhonehHistory[user.charkhonehHistory.length - 1]
            if (!user.charkhonehHistory.length || !user.charkhonehHistory || !lastSubscription || !lastSubscription.charkhonehToken)
                reject({message: 'User has no subscription history', statusCode: 405})
            if (user.charkhonehCancelled)
                reject({message: 'User has cancelled before', statusCode: 409})
            if (!user.charkhonehHistory[user.charkhonehHistory.length - 1].autoRenewing)
                reject({message: 'Subscription is not autoRenew', statusCode: 410})

            return resolve(user)
        })
    })

    const verifyProductPurchase = (phoneNumber, charkhonehToken, productNumber) => {
        logger.info('product number: ' + productNumber)
        logger.info('product charkhonehToken: ' + charkhonehToken)
        const productSku = Object.keys(jhoobinConfig.products[productNumber - 1])[0]
        const jhoobinVerify = {
            uri: jhoobinBaseUrlProducts + productSku + '/tokens/' + charkhonehToken + '?access_token=' + jhoobinConfig.accessToken,
            json: true
        }
        return rpn(jhoobinVerify)
            .then((subscriptionDetails) => {
                logger.info('subscriptionDetails: ' + subscriptionDetails)
                if (subscriptionDetails.purchaseState === 0)
                    return query.upsertCharkhonehProducts(phoneNumber, subscriptionDetails, charkhonehToken)
                else
                    return Promise.reject({message: 'Product is not valid', statusCode: 411})
            }).catch((err) => {
                logger.error(err)
                return Promise.reject({message: 'Problem Verifying product', statusCode: 504})
            })
    }

    const upsertUserFromVas = async (flag, number) => {
        const phoneNumber = '0' + number.trim().substr(6)
        const currentTime = new Date().getTime()
        let ObjectId = require('mongodb').ObjectID
        if (flag === "1") {
            const isUserExists = await query.findByPhoneNumber(phoneNumber)
            if (!isUserExists) {
                const profile = {
                    name: `user${Math.floor(new Date().valueOf() * Math.random())}`,
                    market: "mtn",
                    coin: 1200,
                    charkhonehCancelled: false,
                    phoneNumber: phoneNumber,
                    charkhonehHistory: [{
                        "charkhonehToken": "",
                        "msisdn": phoneNumber,
                        "totalPayment": 0,
                        "todayPayment": 0,
                        "paymentState": 1,
                        "developerPayload": "",
                        "countryCode": "IR",
                        "priceAmountMicros": 3000,
                        "priceCurrencyCode": "IRR",
                        "autoRenewing": true,
                        "expiryTimeMillis": "",
                        "startTimeMillis": currentTime,
                        "kind": "androidpublisher#subscriptionPurchase"
                    }]
                }
                const userData = await query.insertUser(profile)
                logger.info("profile intialized by vas, phoneNumber: " + phoneNumber)
                return {message: '', data: userData}
            }
            else {
                await query.updateUser(phoneNumber)
                return {message: "user updated by vas, phoneNumber: " + phoneNumber, data: {}}
            }
        }
        else if (flag === "0") {
            await query.findUserAndCancel(phoneNumber)
            logger.info("Subscription cancelled by vas, phoneNumber: " + phoneNumber)
            return {message: 'Subscription cancelled', data: {}}
        }
    }

    const response = (res, message, statusCode = 200, data = {}) => {
        logger.info(message + ' ' + statusCode + ' ' + data)
        res.send({
            statusCode: statusCode,
            message: message,
            result: data
        })
    }

    return {
        checkSubscriptionStatus: checkSubscriptionStatus,
        verifySubscriptionPurchase: verifySubscriptionPurchase,
        cancelSubscription: cancelSubscription,
        verifyProductPurchase: verifyProductPurchase,
        response: response,
        checkStatusAfterLogin: checkStatusAfterLogin,
        upsertUserFromVas: upsertUserFromVas
    }
}