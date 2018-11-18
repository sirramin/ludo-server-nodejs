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

    async addToList(userId, username) {
        const friend = await this.query.searchByUsername(username)
        if (!friend)
            throw ({message: 'user not exists', statusCode: 4})
        else {
            await this.query.addToArray(userId, username)
            return friend
        }
    }

    async removeFromList(userId, username) {
        const friend = await this.query.searchByUsername(username)
        const user = await this.query.searchById(userId)

        if (!friend)
            throw ({message: 'user not exists', statusCode: 4})
        if (!user.hasOwnProperty('friends') || user.friends.indexOf(username) < 0)
            throw ({message: 'this user is not in your list', statusCode: 5})
        else {
            await this.query.removeFromArray(userId, friend.username)
            return friend
        }
    }

    async getFriends(userId) {
        return await this.query.searchById(userId)
    }

}

module.exports = userServiceClass
