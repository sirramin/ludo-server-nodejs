const _ = require('lodash'),
    queryClass = require('./query-class'),
    userQueryClass = require('../../user/class/query-class'),
    redisClient = require('../../../common/redis-client'),
    gameIdentifier = require('../../../common/gameIdentifier')

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

    async selectCastle(userId, castleNumber, market) {
        const marketName = (market === 'mtn' || market === 'mci') ? market : 'market',
            marketKey = 'menchman:users:' + marketName

        const userInfoParsed = JSON.parse(await redisClient.hget(marketKey, userId))
        userInfoParsed.castleNumber = castleNumber
        await redisClient.hset('menchman:users:' + market, userId, JSON.stringify(userInfoParsed))
        return await this.query.updateSelectedCastle(userId, castleNumber)
    }

    async updateLevels(level, userId) {
        const gameMeta = await gameIdentifier.getGameMeta(this.dbUrl)
        const userData = await this.query.getUserData(userId)
        let updateQuery
        if (level === 'capacity') {
            if (userData.capacityLevel >= gameMeta.capacityMaxLevel)
                throw({message: 'Bigger than max level', code: 3})

            updateQuery = {$inc: {capacityLevel: 1}}
        }

        if (level === 'cph') {
            if (userData.cphLevel >= gameMeta.cphMaxLevel)
                throw({message: 'Bigger than max level', code: 3})

            updateQuery = {$inc: {cphLevel: 1}}
        }

        return await this.query.updateLevels(userId, updateQuery)
    }

}

module.exports = gameDataServiceClass
