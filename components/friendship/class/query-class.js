const userModelClass = require('../../user/class/model-class')

const userQueryClass = class {

    constructor(dbUrl) {
        const userModelObject = new userModelClass(dbUrl)
        this.userModel = userModelObject.getModel()
    }

    async searchByUsername(username) {
        return await this.userModel.findOne({username: username}).lean().exec()
    }

    async searchById(userId) {
        return await this.userModel.findOne({_id: userId}).lean().exec()
    }

    async addToArray(userId, username) {
        return await this.userModel.update({_id: userId}, { $addToSet: { friends: username } }).lean().exec()
    }

}

module.exports = userQueryClass