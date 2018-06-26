const rpn = require('request-promise-native'),
    query = require('./query'),
    jwt = require('../../common/jwt'),
    _ = require('lodash'),
    leaderboardService = require('../leaderboard/service'),
    base64 = require('base-64'),
    configData = require('../../common/config');

const checkSubscriptionStatus = async (phoneNumber) => {
    const number = '98' + phoneNumber.substr(1)
    const urlTemplate = _.template(configData.vas.validationUrl)
    const url = urlTemplate({'number': number})
    try {
        const isActive = await rpn({uri: url, json: true})
        return isActive.status === 'active'
    }
    catch (e) {
        throw new Error({message: 'Check SubscriptionStatus error', statusCode: 7})
    }
}

const checkUserExists = async (phoneNumber) => {
    try {
        return await query.checkUserExists(phoneNumber)
    }
    catch (e) {
        throw new Error({message: 'Check user db error', statusCode: 6})
    }
}

const requestSms = async (phoneNumber) => {
    const options = {
        method: 'POST',
        uri: 'https://otp.artatel.ir/api/otp/v1/request/masterOfMind/' + phoneNumber,
        headers: {
            'Authorization': 'Basic ' + base64.encode(configData.otp.username + configData.otp.password)
        },
        json: true
    };
    try {
        result = await rpn.post(options)
        if (result.statusCode === 200)
            return {cpUniqueToken: result.cpUniqueToken, otpTransactionId: result.otpTransactionId}
        else
            throw new Error()
    }
    catch (e) {
        throw new Error({message: 'Request sms error', statusCode: 5})
    }
}

const requestLoginSms = async (phoneNumber) => {
    const code = _.random(1, 99999)
    const number = '98' + phoneNumber.substr(1);
    const urlTemplate = _.template(configData.vas.smsUrl)
    const url = urlTemplate({'number': number, 'smsVerifyCode': code})
    try {
        await query.updateVerifyCode(phoneNumber, code)
        await rpn({uri: url, json: true})
    }
    catch (e) {
        throw new Error({message: 'Request login sms error', statusCode: 9})
    }
}

const verifySms = async (code, phoneNumber) => {
    await query.validateSmsCode(code)
}


const addUser = async (phoneNumber) => {
    const user = {
        name: 'user' + _.random(1, 99999),
        phoneNumber: phoneNumber,
        market: 'mci'
    }
    const returnedUser = await query.insertUser(user)
    const returnedUserId = (returnedUser._doc._id).toString()
    const returneduserName = returnedUser._doc.name
    return await leaderboardService.firstTimeScore(returneduserName, returnedUserId)
}

const getUserInfo = async (phoneNumber) => {
    try {
        const returnedUser = await query.findUser(phoneNumber)
        const user = {
            name: returnedUser.name,
            userId: returnedUser._id,
            phoneNumber: phoneNumber,
            market: returnedUser.market
        }
        const token = await jwt.generateJwt(user)
        return {
            name: returnedUser.name,
            userId: returnedUser._id,
            phoneNumber: phoneNumber,
            token: token,
            coin: returnedUser.coin
        }
    }
    catch (e) {
        return {message: 'Get user info error', statusCode: 24}
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
        uri: 'https://otp.artatel.ir/api/otp/v1/confirmation/masterOfMind/' + phoneNumber,
        body: {
            "verificationCode": verificationCode,
            "cpUniqueToken": cpUniqueToken,
            "otpTransactionId": otpTransactionId
        },
        headers: {
            'Authorization': 'Basic ' + base64.encode(configData.otp.username + ' ' + configData.otp.password)
        },
        json: true
    };
    try {
        const result = await rpn.post(options)
        console.log('confirmation result: ' + result)
        if (result.statusCode === 200) {
            return await getUserInfo(phoneNumber)
        }
        else
            throw new Error({message: 'Code is not valid', statusCode: 25})
    }
    catch (e) {
        if (!e.statusCode)
            throw new Error({message: 'confirmation OTP error', statusCode: 21})
        else
            throw new Error(e)
    }
}

const verifyLoginSms = async (phoneNumber, verificationCode) => {
    const isCodeValid = await query.checkCodeIsValid(phoneNumber, verificationCode)
    if (isCodeValid)
        return await getUserInfo(phoneNumber)
    else
        return {message: 'Code is not valid', statusCode: 25}
}

module.exports = {
    checkUserExists: checkUserExists,
    checkSubscriptionStatus: checkSubscriptionStatus,
    confirmation: confirmation,
    requestSms: requestSms,
    addUser: addUser,
    getUserInfo: getUserInfo,
    requestLoginSms: requestLoginSms,
    verifySms: verifySms
}