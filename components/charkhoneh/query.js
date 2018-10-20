module.exports = (dbUrl) => {
    const userModel = require('../user/model')(dbUrl),
        _ = require('lodash')

    const upsertCharkhonehHistory = async (phoneNumber, subscriptionDetails, charkhonehToken) => {
        subscriptionDetails.token = charkhonehToken
        try {
            const user = await userModel.findOneAndUpdate({phoneNumber: phoneNumber}, {
                $set: {charkhonehCancelled: false},
                $addToSet: {charkhonehHistory: subscriptionDetails}
            }).lean().exec()
            if (user) {
                return user
            }
            else {
                let defaultCoin
                dbUrl === 'moogy' ? defaultCoin = 2 : defaultCoin = 1400
                const insertedUser = await insertUser({
                    name: 'user' + _.random(10000, 99999),
                    phoneNumber: phoneNumber,
                    market: "mtn",
                    charkhonehCancelled: false,
                    charkhonehHistory: subscriptionDetails,
                    coin: defaultCoin
                })
                return insertedUser
            }
        }
        catch (e) {
            logger.error(e)
        }
    }

    const upsertCharkhonehProducts = (phoneNumber, productDetails, token) => {
        productDetails.token = token
        return userModel.findOneAndUpdate({phoneNumber: phoneNumber}, {
            $addToSet: {charkhonehProducts: productDetails}
        }).exec()
    }

    const findUserAndCancel = (phoneNumber) => {
        return userModel.updateOne({phoneNumber: phoneNumber}, {
            $set: {charkhonehCancelled: true}
        })
    }

    const updateVerifyCode = async (phoneNumber, verificationCode) => {
        return await userModel.updateOne({phoneNumber: phoneNumber}, {
            phoneNumber: phoneNumber,
            verificationCode: verificationCode
        })
    }

    const insertUser = async (profile) => {
        const newUser = new userModel(profile)
        return await newUser.save()
    }

    const updateUser = async (phoneNumber) => {
        return await userModel.updateOne({phoneNumber: phoneNumber}, {
            $set: {charkhonehCancelled: false}
        })
    }

    const cancelChakhoneh = async (phoneNumber) => {
        return await userModel.updateOne({phoneNumber: phoneNumber}, {
            $set: {charkhonehCancelled: true}
        })
    }

    const findByPhoneNumber = async (phoneNumber) => {
        return await userModel.findOne({phoneNumber: phoneNumber}).lean().exec()
    }

    const checkCodeIsValid = async (phoneNumber, code) => {
        return await userModel.findOne({phoneNumber: phoneNumber, verificationCode: code}).lean().exec()
    }

    return {
        upsertCharkhonehHistory: upsertCharkhonehHistory,
        upsertCharkhonehProducts: upsertCharkhonehProducts,
        findUserAndCancel: findUserAndCancel,
        updateVerifyCode: updateVerifyCode,
        insertUser: insertUser,
        updateUser: updateUser,
        findByPhoneNumber: findByPhoneNumber,
        checkCodeIsValid: checkCodeIsValid,
        cancelChakhoneh: cancelChakhoneh
    }
}