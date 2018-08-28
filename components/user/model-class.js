const _ = require('lodash')
const mongooseClientClass = require('../../common/mongoose-client-class')

const leaderboardModelClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        const mongooseClientObj = new mongooseClientClass(dbUrl)
        this.mongooseClient = mongooseClientObj.getClient()
        this.userSchema = this.mongooseClient.Schema({
            name: {type: String, required: true},
            username: {type: String, unique: true, index: false},
            password: String,
            phoneNumber: {type: String, unique: true, index: false},
            market: {type: String, required: true},
            coin: {type: Number, default: 1400},
            win: {type: Number, default: 0},
            lose: {type: Number, default: 0},
            score: {type: Number, default: 0},
            registerDate: {type: Date, default: new Date()},
            verificationCode: String,
            charkhonehCancelled: Boolean,
            charkhonehHistory: [],
            charkhonehProducts: []
        })
    }

    getModel() {
        if (_.has(connections[this.dbUrl].models, 'users'))
            return connections[this.dbUrl].model('users')
        else
            return connections[this.dbUrl].model('users', this.userSchema)
    }
}

module.exports = leaderboardModelClass