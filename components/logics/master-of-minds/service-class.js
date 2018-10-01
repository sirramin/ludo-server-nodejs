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
