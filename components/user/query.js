module.exports = (dbUrl) => {
    const userModel = require('./model')(dbUrl)

    const checkUserExists = async (username) => {
        return await userModel.findOne({username: username}).lean().exec()
    }

    const insertUser = async (username, hashedPassword, phoneNumber, market, name) => {
        const user = new userModel({
            username: username,
            password: hashedPassword,
            phoneNumber: phoneNumber,
            market: market,
            name: name
        })
        return await user.save({lean: true})
    }

    const insertGuestUser = async (market, name) => {
        const user = new userModel({
            market: market,
            name: name
        })
        return await user.save({lean: true})
    }

    const updateUser = async (query, update) => {
        userModel.update()
    }

    return {
        checkUserExists: checkUserExists,
        insertUser: insertUser,
        updateUser: updateUser,
        insertGuestUser: insertGuestUser
    }
}