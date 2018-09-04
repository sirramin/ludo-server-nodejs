const _ = require('lodash'),
    queryClass = require('./query-class'),
    userQueryClass = require('../../user/class/query-class')

const gameDataServiceClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        this.query = new queryClass(dbUrl)
        this.userQuery = new userQueryClass(dbUrl)
    }

    async buyCastle(userId, castleNumber) {
        const castleCoins = await this.query.getCastleCoin(castleNumber)
        if(!this.checkHasEnoughCoins(userId, castleNumber, castleCoins))
            throw({message: 'You have not enough coins', code: 2})

        await this.userQuery.updateCoin(userId, -Math.abs(castleCoins))
        return await this.query.addCastleToUserGameData(userId, castleNumber)
    }

    async checkHasEnoughCoins(userId, castleCoins) {
        const userCoins = await this.userQuery.getUserCoins(userId)
        return userCoins < castleCoins
    }

}

module.exports = gameDataServiceClass
