const userModelClass = require('./model-class')

const userQueryClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        const userModelObject = new userModelClass(dbUrl)
        this.userModel = userModelObject.getModel()
    }


    async checkUserExists(username) {
        return await this.userModel.findOne({username: username}).lean().exec()
    }


    async checkUserExistsByEmailOrUsername(emailOrUsername) {
        return await this.userModel.findOne({
                $or: [{
                    email: emailOrUsername
                }, {
                    username: emailOrUsername
                }]
            }
        ).lean().exec()
    }

    async checkUserAlreadyExists(query) {
        return await this.userModel.findOne(query).lean().exec()
    }
}

module.exports = userQueryClass