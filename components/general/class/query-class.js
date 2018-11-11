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

}

module.exports = userQueryClass