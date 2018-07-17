module.exports = (dbUrl) => {
    const userModel = require('../user/model')(dbUrl)

    const upsertCharkhonehHistory = (phoneNumber, subscriptionDetails, charkhonehToken) => {
        subscriptionDetails.token = charkhonehToken
        return new Promise((resolve, reject) => {
            userModel.findOneAndUpdate({phoneNumber: phoneNumber},
                {
                    $set: {charkhonehCancelled: false},
                    $addToSet: {charkhonehHistory: subscriptionDetails}
                }).exec().then((user) => {
                logger.info('user: ' + user)
                if (user) {
                    resolve(user._doc)
                }
                else {
                    insertUser({
                        charkhonehCancelled: false,
                        name: {type: String, required: true},
                        username: {type: String, unique: true, index: false},
                        password: String,
                        phoneNumber: {type: String, unique: true, index: false},
                        market: {type: String, required: true},
                        coin: {type: Number, default: 1400},
                        registerDate: {type: Date, default: new Date()},
                        verificationCode: String
                    })

                }
            })
                .catch(err => {
                    reject(err)
                })
        })
    }

    const upsertCharkhonehProducts = (phoneNumber, productDetails, charkhonehToken) => {
        productDetails.token = token
        return userModel.findOneAndUpdate({phoneNumber: phoneNumber}, {
            $addToSet: {charkhonehProducts: productDetails}
        }).exec()
    }

    const findUserAndCancel = (phoneNumber) => {
        return userModel.update({phoneNumber: phoneNumber}, {
            $set: {charkhonehCancelled: true}
        })
    }

    const updateVerifyCode = ((phoneNumber, verificationCode) => {
        return Models.verificationCodes.updateVerifyCode({
            phoneNumber: phoneNumber,
            verificationCode: verificationCode
        })
    })

    const insertUser = async (profile) => {
        const newUser = new userModel(profile)
        return await newUser.save()
    }

    const updateUser = async (phoneNumber) => {
        return await userModel.update({phoneNumber: phoneNumber}, {
            $set: {charkhonehCancelled: false}
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
        checkCodeIsValid: checkCodeIsValid
    }
}