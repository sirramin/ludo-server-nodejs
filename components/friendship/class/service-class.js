const jwt = require('../../../common/jwt'),
    _ = require('lodash'),
    queryClass = require('./query-class')


const userServiceClass = class {

    constructor(dbUrl, market) {
        this.dbUrl = dbUrl
        this.marketKey = this.dbUrl + ':users:' + 'market'
        this.query = new queryClass(this.dbUrl)
    }

    async searchByUsername(username) {
        return await this.query.searchByUsername(username)
    }

    async addToList(userId, friendId) {
        const user = await this.query.searchById(friendId)
        if(!user)
            throw ({message: 'user not exists', statusCode: 7})
        else
            await this.query.addToArray(userId, user.username)
    }

}

module.exports = userServiceClass
