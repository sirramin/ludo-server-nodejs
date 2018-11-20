const _ = require('lodash'),
    queryClass = require('./query-class')
و
redisClient = require('../../../common/redis-client')


const userServiceClass = class {

    constructor(dbUrl, market) {
        this.dbUrl = dbUrl
        this.market = market
        this.marketKey = this.dbUrl + ':users:' + 'market'
        this.query = new queryClass(this.dbUrl)
    }

    async searchByUsername(username) {
        return await this.query.searchByUsername(username)
    }

    async addToList(myUserId, username, myUsername) {
        const friend = await this.query.searchByUsername(username)
        if (!friend)
            throw ({message: 'user not exists', statusCode: 4})
        else {
            await this.query.addToFollowings(myUserId, username, friend._id)
            await this.query.addToOpponentFollowers(myUsername, myUserId, username)
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

    async getFollowings(userId) {
        const user = await this.query.searchById(userId)
        const arrayOfFollowings = user.followings
        let arrayOfFollowingsWithStatus = []
        for (let i in arrayOfFollowings) {
            const status = this.checkFriendOnlineStatus(arrayOfFollowings[i].userId)
            arrayOfFollowingsWithStatus.push({
                username: arrayOfFollowings[i],
                status: status
            })
        }
        return arrayOfFollowingsWithStatus
    }

    async checkFriendOnlineStatus(userId) {
        const userData = await redisClient.hget(this.marketKey, userId)
        return JSON.parse(userData).status
    }

}

module.exports = userServiceClass
