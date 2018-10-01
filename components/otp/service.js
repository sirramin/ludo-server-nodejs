const rpn = require('request-promise-native'),
    jwt = require('../../common/jwt'),
    _ = require('lodash'),
    base64 = require('base-64')

module.exports = (dbUrl) => {
    const query = require('./query')(dbUrl),
        configData = require('./config')[dbUrl],
        otpHeader = 'Basic ' + base64.encode(configData.otp.username + ':' + configData.otp.password).toString(),
    gameService = require('../logics/' + dbUrl + '/service-class')


    const checkSubscriptionStatus = async (phoneNumber) => {
        const number = '98' + phoneNumber.substr(1)
        const urlTemplate = _.template(configData.vas.validationUrl)
        const url = urlTemplate({'number': number})
        try {
            const isActive = await rpn({uri: url, json: true})
            return isActive.status === 'active'
        }
        catch (e) {
            throw ({message: 'Check SubscriptionStatus error', statusCode: 7})
        }
    }

    const checkUserExists = async (phoneNumber) => {
        try {
            return await query.checkUserExists(phoneNumber)
        }
        catch (e) {
            throw ({message: 'Check user db error', statusCode: 6})
        }
    }

    const requestSms = async (phoneNumber) => {
        const options = {
            method: 'POST',
            uri: configData.artatelOtp.request + phoneNumber,
            headers: {
                'Authorization': otpHeader
            },
            json: true
        };
        try {
            result = await rpn.post(options)
            return {cpUniqueToken: result.result.cpUniqueToken, otpTransactionId: result.result.otpTransactionId}
        }
        catch (e) {
            throw ({message: 'Request sms error', statusCode: 5})
        }
    }

    const requestLoginSms = async (phoneNumber) => {
        const code = _.random(10000, 99999)
        logger.info('Login Sms code: ' + code)
        const number = '98' + phoneNumber.substr(1);
        const urlTemplate = _.template(configData.vas.smsUrl)
        const url = urlTemplate({'number': number, 'smsVerifyCode': code})
        try {
            await query.updateVerifyCode(phoneNumber, code.toString())
            await rpn({uri: url, json: true})
        }
        catch (e) {
            throw ({message: 'Request login sms error', statusCode: 9})
        }
    }

    // const verifySms = async (code, phoneNumber) => {
    //     await query.validateSmsCode(code)
    // }


    const addUser = async (phoneNumber) => {
        const leaderboardService = require('../leaderboard/service')(dbUrl, 'mci')
        try {
            const user = {
                name: 'user' + _.random(1, 99999),
                phoneNumber: phoneNumber,
                market: 'mci'
            }
            const returnedUser = await query.insertUser(user)
            const returnedUserId = (returnedUser._doc._id).toString()
            const returneduserName = returnedUser._doc.name
            await leaderboardService.firstTimeScore(returneduserName, returnedUserId)

            if (dbUrl === 'moogy') {
                const gameServiceObj = new gameService(dbUrl)
                await gameServiceObj.insertUserGameData(returnedUserId)
            }
        }
        catch (e) {
            throw {message: 'error adding user', statusCode: 26}
        }
    }

    const getUserInfo = async (phoneNumber) => {
        try {
            const returnedUser = await query.checkUserExists(phoneNumber)
            const token = await jwt.generateJwt(dbUrl, returnedUser._id, returnedUser.name, returnedUser.market, phoneNumber)
            return {
                name: returnedUser.name,
                userId: returnedUser._id,
                phoneNumber: phoneNumber,
                token: token,
                coin: returnedUser.coin
            }
        }
        catch (e) {
            throw {message: 'Get user info error', statusCode: 24}
        }
    }

    const getUserCoin = async (phoneNumber) => {
        try {
            const returnedUser = await query.checkUserExists(phoneNumber)
            return returnedUser.coin
        }
        catch (e) {
            throw {message: 'Get user info error', statusCode: 24}
        }
    }

    const confirmation = async (phoneNumber, verificationCode, cpUniqueToken, otpTransactionId) => {
        if (cpUniqueToken && otpTransactionId)
            return await verifyOtpSMS(phoneNumber, verificationCode, cpUniqueToken, otpTransactionId)
        else
            return await verifyLoginSms(phoneNumber, verificationCode)
    }

    const verifyOtpSMS = async (phoneNumber, verificationCode, cpUniqueToken, otpTransactionId) => {
        const options = {
            method: 'POST',
            uri: configData.artatelOtp.confirmation + phoneNumber,
            body: {
                "verificationCode": verificationCode,
                "cpUniqueToken": cpUniqueToken,
                "otpTransactionId": otpTransactionId
            },
            headers: {
                'Authorization': otpHeader
            },
            json: true
        }
        try {
            const result = await rpn.post(options)
            logger.info('result: ' + JSON.stringify(result))
            logger.info('confirmation result: ' + JSON.stringify(result.result))
            return await getUserInfo(phoneNumber)
        }
        catch (e) {
            // if (e.statusCode === 500)
            //     throw {message: 'Code is not valid', statusCode: 25}
            // else
            logger.error(e.message)
            throw {message: 'OTP error', statusCode: 21}
        }
    }

    const verifyLoginSms = async (phoneNumber, verificationCode) => {
        logger.info('login verificationCode:', verificationCode)
        const isCodeValid = await query.checkCodeIsValid(phoneNumber, verificationCode)
        if (isCodeValid)
            return await getUserInfo(phoneNumber)
        else
            throw {message: 'Code is not valid', statusCode: 25}
    }

    const insertUserFromVas = async (phoneNumber, operator, gameName) => {
        const leaderboardService = require('../leaderboard/service')(gameName, operator)
        const currentTime = new Date().getTime()
        try {
            const user = {
                name: 'user' + _.random(1, 99999),
                phoneNumber: phoneNumber,
                market: operator
            }
            if (operator === 'mtn') {
                user.charkhonehCancelled = false
                user.charkhonehHistory = [{
                    "token": "",
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
            const returnedUser = await query.insertUser(user)
            const returnedUserId = (returnedUser._doc._id).toString()
            const returneduserName = returnedUser._doc.name
            return await leaderboardService.firstTimeScore(returneduserName, returnedUserId)
        }
        catch (e) {
            logger.error(e)
            throw {message: 'error adding user form vas', statusCode: 26}
        }
    }

    return {
        checkUserExists: checkUserExists,
        checkSubscriptionStatus: checkSubscriptionStatus,
        confirmation: confirmation,
        requestSms: requestSms,
        addUser: addUser,
        getUserInfo: getUserInfo,
        requestLoginSms: requestLoginSms,
        // verifySms: verifySms,
        getUserCoin: getUserCoin,
        insertUserFromVas: insertUserFromVas
    }
}