const _ = require('lodash')
const mongooseClientClass = require('../../../common/mongoose-client-class')

const userGameDataModelClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        const mongooseClientObj = new mongooseClientClass(dbUrl)
        this.mongooseClient = mongooseClientObj.getClient()
        this.ObjectId = this.mongooseClient.Schema.Types.ObjectId
        this.userGameDataSchema = this.mongooseClient.Schema({
            userId: {type: this.ObjectId},
            hints: {type: Number, default: 4}
        })
    }

    getModel() {
        if (_.has(connections[this.dbUrl].models, 'usergamedatas'))
            return connections[this.dbUrl].model('usergamedatas')
        else
            return connections[this.dbUrl].model('usergamedatas', this.userGameDataSchema)
    }

}

module.exports = userGameDataModelClass


