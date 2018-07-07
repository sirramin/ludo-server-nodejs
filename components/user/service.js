const jwt = require('../../common/jwt'),
    _ = require('lodash')

module.exports = (dbUrl) => {
    const query = require('./query')(dbUrl)

    const checkUserExists = async (username) => {
        return await query.checkUserExists(username)
    }

    const registerUser = async (username, password, phoneNumber, market) => {
        const name = 'user' + _.random(1, 99999)
        try {
            const user = await query.insertUser(username, password, phoneNumber, market, name)
            const token = await jwt.generateJwt(dbUrl, user._id, name, market, phoneNumber = '', username, password)
            return {token: token}
        }
        catch (err) {
            return ({message: 'error registering user', statusCode: 2})
        }
    }

    return {
        registerUser: registerUser,
        checkUserExists: checkUserExists
    }
}