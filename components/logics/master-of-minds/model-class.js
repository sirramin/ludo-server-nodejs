const _ = require('lodash')
const mongooseClientClass = require('../../../common/mongoose-client-class')

const userGameDataModelClass = class {


    constructor(dbUrl) {
        const defaultPowerUps = {
            worthlessMarble: 4,
            vibration: 4,
            correctColor: 4,
            increaseTime: 4,
            correctPosition: 4,
            doNotDecreaseCoin: 4,
        }

        this.dbUrl = dbUrl
        const mongooseClientObj = new mongooseClientClass(dbUrl)
        this.mongooseClient = mongooseClientObj.getClient()
        this.ObjectId = this.mongooseClient.Schema.Types.ObjectId
        this.userGameDataSchema = this.mongooseClient.Schema({
            userId: {type: this.ObjectId},
            cphLevel: {type: Number, default: 1},
            capacityLevel: {type: Number, default: 1},
            capacity: {type: Number, default: 1000},
            coinPerHour: {type: Number, default: 200},
            powerups: {type: this.mongooseClient.Schema.Types.Mixed, default: defaultPowerUps}
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


