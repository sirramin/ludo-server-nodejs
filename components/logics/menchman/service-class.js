const _ = require('lodash'),
    queryClass = require('./query-class'),
    userQueryClass = require('../../user/class/query-class')

const gameDataServiceClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        this.query = new queryClass(dbUrl)
        this.userQuery = new userQueryClass(dbUrl)
    }

    async insertUserGameData(userId) {
        const newUserGameData = await this.query.insertUserGameData(userId)
        return newUserGameData._doc
    }

    async buyCastle(userId, castleNumber) {
        const castleCoins = await this.query.getCastleCoin(castleNumber)
        if (!await this.checkHasEnoughCoins(userId, castleCoins))
            throw({message: 'You have not enough coins', code: 2})
        if (await this.checkAlreadyHasCastle(userId, castleNumber))
            throw({message: 'You already bought this castle', code: 3})

        await this.userQuery.updateCoin(userId, -Math.abs(castleCoins))
        return await this.query.addCastleToUserGameData(userId, castleNumber)
    }

    async checkHasEnoughCoins(userId, castleCoins) {
        const userCoins = await this.userQuery.getUserCoins(userId)
        return userCoins >= castleCoins
    }

    async checkAlreadyHasCastle(userId, castleNumber) {
        const userData = await this.query.getUserData(userId)
        const unlockedCastles = userData.unlockedCastles
        return unlockedCastles.indexOf(castleNumber) > -1
    }

    async selectCastle(userId, castleNumber) {
        return await this.query.updateSelectedCastle(userId, castleNumber)
    }

}

module.exports = gameDataServiceClass
