const userModel = require('./model')
const checkUserExists = (username) => {
    return users.findOne({username: username})
}

const insertUser = async (username, hashedPassword, phoneNumber, name, market) => {
    const user = new userModel({
        username: username,
        password: hashedPassword,
        phoneNumber: phoneNumber,
        market: market,
        name: name
    })
    return await user.save({lean: true})
}

const updateUser = (query, update) => {

}
module.exports = {
    checkUserExists: checkUserExists,
    insertUser: insertUser,
    updateUser: updateUser
}