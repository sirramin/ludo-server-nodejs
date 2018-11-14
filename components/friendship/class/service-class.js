const jwt = require('../../../common/jwt'),
    _ = require('lodash'),
    queryClass = require('./query-class')


const userServiceClass = class {

    constructor(dbUrl, market) {
        this.dbUrl = dbUrl
        this.marketKey = this.dbUrl + ':users:' + 'market'
        this.queryClassObj = new queryClass(this.dbUrl)
    }

    async checkUserExists(phoneNumber) {
        return await userModel.findOne({phoneNumber: phoneNumber}).lean().exec()
    }

}

module.exports = userServiceClass
