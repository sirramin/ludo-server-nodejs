const _ = require('lodash')
const mongooseClientClass = require('../../../common/mongoose-client-class')

const userModelClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        const mongooseClientObj = new mongooseClientClass(dbUrl)
        this.mongooseClient = mongooseClientObj.getClient()
        this.userSchema = this.mongooseClient.Schema({
            userId: String,
            friends: [],

        })
    }

    getModel() {
        if (_.has(connections[this.dbUrl].models, 'users'))
            return connections[this.dbUrl].model('users')
        else
            return connections[this.dbUrl].model('users', this.userSchema)
    }
}

module.exports = userModelClass