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
            unlockedCastles: {type: [Number], default: [1]},
            cphLevel: {type: Number, default: 1},
            capacityLevel: {type: Number, default: 1},
            capacity: {type: Number, default: 1000},
            coinPerHour: {type: Number, default: 200},
            selectedCastle: {type: Number, default: 1}
        })

        this.castleSchema = this.mongooseClient.Schema({
            number : Number,
            en : String,
            fa : String,
            coin : Number
        })
    }

    getModel() {
        if (_.has(connections[this.dbUrl].models, 'usergamedatas'))
            return connections[this.dbUrl].model('usergamedatas')
        else
            return connections[this.dbUrl].model('usergamedatas', this.userGameDataSchema)
    }

    getCastleModel() {
        if (_.has(connections[this.dbUrl].models, 'castles'))
            return connections[this.dbUrl].model('castles')
        else
            return connections[this.dbUrl].model('castles', this.castleSchema)
    }

}

module.exports = userGameDataModelClass


