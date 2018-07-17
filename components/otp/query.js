const _ = require('lodash')

module.exports = (dbUrl) => {
    const userModel = require('../user/model')(dbUrl)

    const checkUserExists = async (phoneNumber) => {
        return await userModel.findOne({phoneNumber: phoneNumber}).lean().exec()
    }

    const insertUser = async (user) => {
        return await userModel.create(user)
    }

    const updateVerifyCode = async (phoneNumber, code) => {
        return await userModel.findOneAndUpdate({phoneNumber: phoneNumber}, {verificationCode: code}).lean().exec()
    }

    const checkCodeIsValid = async (phoneNumber, code) => {
        return await userModel.findOne({phoneNumber: phoneNumber, verificationCode: code}).lean().exec()
    }

    return {
        checkUserExists: checkUserExists,
        insertUser: insertUser,
        updateVerifyCode: updateVerifyCode,
        checkCodeIsValid: checkCodeIsValid
    }
}