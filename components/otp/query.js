const _ = require('lodash')

module.exports = (dbUrl) => {
    const userModel = require('../user/model')(dbUrl)

    const checkUserExists = async (phoneNumber) => {
        return await userModel.findOne({phoneNumber: phoneNumber}).lean().exec()
    }

    const insertUser = async (user) => {
        return await userModel.create(user)
    }

    const updateUser = async (query, update) => {

    }

    const updateVerifyCode = async (phoneNumber, code) => {
        return await userModel.findOneAndUpdate({phoneNumber: phoneNumber}, {verificationCode: code}).lean().exec()
    }

    const checkCodeIsValid = async (phoneNumber, code) => {
       const user =  await userModel.findOne({phoneNumber: phoneNumber, verificationCode: code}).lean().exec()
        return user
    }

    return {
        checkUserExists: checkUserExists,
        insertUser: insertUser,
        updateUser: updateUser,
        updateVerifyCode: updateVerifyCode,
        checkCodeIsValid: checkCodeIsValid
    }
}