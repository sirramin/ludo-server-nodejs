const userModel = require('./model')
const checkUserExists = (username) => {
    return users.findOne({username: username})
}

const insertUser = async (username, hashedPassword, phoneNumber) => {
    const user = new userModel({
        username: username,
        password: hashedPassword,
        phoneNumber: phoneNumber
    })
    return await user.save()
}

const updateUser = (query, update) => {

}
module.exports = {
    checkUserExists: checkUserExists,
    insertUser: insertUser,
    updateUser: updateUser
}