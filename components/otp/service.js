const rpn = require('request-promise-native'),
    query = require('./configData'),
    jwt = require('../../common/jwt'),
    configData = require('../../config-data');

const checkSubscriptionStatus = async (phoneNumber) => {
    let path = configData.vasValidationUrl;
    let number = '98' + phoneNumber.substr(1);
    let url = String.format(path, number);
    let options = {
        method: 'get',
        uri: url,
    };

    const isActive = await rpn(options)
    return isActive.statusCode !== 'inactive'
}

const checkUserExists = async (phoneNumber) => {
    return await query.checkUserExists(user)
}

const requestSms = async (phoneNumber) => {
    const options = {
        method: 'POST',
        uri: 'https://otp.artatel.ir/api/otp/v1/request/masterOfMind/' + phoneNumber,
        headers: {
            'Authorization': 'Basic ' + base64_encode(configData.otp.username + configData.otp.password)
        },
        json: true
    };
    try {
        result = await rpn.post(options)
        if (result.statusCode === 200)
            return {
                statusCode: 409,
                data: {cpUniqueToken: result.cpUniqueToken, otpTransactionId: result.otpTransactionId}
            }
        else
            throw new Error()
    }
    catch (e) {
        return {message: 'OTP error', statusCode: 500}
    }
}


const insertUser = async (phoneNumber) => {
    const user = {
        name: 'user' + _.random(1, 99999),
        phoneNumber: phoneNumber,
        market: 'mci'
    }
    const returnedUser = await query.insetUser(user)
    const token = await jwt.generateJwt(user)
    return {
        name: returnedUser.name,
        userId: returnedUser._id,
        phoneNumber: phoneNumber,
        token: token,
        coin: 0
    }
}

const getUserInfo = async (phoneNumber) => {
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
        coin: 0
    }
}

const confirmation = async (phoneNumber, verificationCode, cpUniqueToken, otpTransactionId) => {
    const options = {
        method: 'POST',
        uri: 'https://otp.artatel.ir/api/otp/v1/confirmation/masterOfMind/' + phoneNumber,
        body: {
            "verificationCode": verificationCode,
            "cpUniqueToken": cpUniqueToken,
            "otpTransactionId": otpTransactionId
        },
        headers: {
            'Authorization': 'Basic ' + base64_encode(configData.otp.username + configData.otp.password)
        },
        json: true
    };
    try {
        result = await rpn.post(options)
        if (result.statusCode === 200) {
            query.insertUser()
            return {message: 'Successfully registered', statusCode: 409}

        }
        else
            return {message: 'OTP error', statusCode: 510}
    }
    catch (e) {
        return {message: 'OTP error', statusCode: 510}
    }
}

module.exports = {
    checkUserExists: checkUserExists,
    checkSubscriptionStatus: checkSubscriptionStatus,
    confirmation: confirmation,
    requestSms: requestSms,
    insertUser: insertUser,
    getUserInfo: getUserInfo
}