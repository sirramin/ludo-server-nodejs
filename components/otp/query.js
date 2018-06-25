const userModel = require('../user/model'),
    _ = require('lodash');


const checkUserExists = async (username) => {
    return await userModel.findOne({username: username})
}

const insertUser = async (user) => {
    return await user.save(user)
}

const updateUser = (query, update) => {

}

module.exports = {
    checkUserExists: checkUserExists,
    insertUser: insertUser,
    updateUser: updateUser
}