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
        this.powerupEnum = [
            {"worthlessMarble": 300},
            {"vibration": 20},
            {"correctColor": 400},
            {"increaseTime": 100},
            {"correctPosition": 1200},
            {"doNotDecreaseCoin": 100}
        ]
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

    async updatePowerUps(powerUpCode, userId) {

        const powerup = this.powerupEnum[powerUpCode]
        const powerUpCoin = Object.values(powerup)[0]
        const powerUpText = Object.keys(powerup)[0]
        const userData = await this.query.getUserData(userId)
        const currentCoin = userData.userInfo[0].coin
        if (currentCoin < powerUpCoin) throw({message: 'You do not have enough coins', code: 3})

        // const currentPower = userData.powerups[powerUp]
        // if (!currentPower) throw({message: '', code: 3})

        const updatedCoin = await this.userQuery.updateCoin(userId, -powerUpCoin)

        let incObject = {}
        incObject['powerups.' + powerUpText] = 1
        return await this.query.updatePowerUps(userId, {$inc: incObject})

    }

    async decreasePowerUps(powerupArray, userId) {
        const userData = await this.query.getUserData(userId)
        powerupArray.forEach(async powerUpCode => {
            const powerup = this.powerupEnum[powerUpCode]
            const powerUpText = Object.keys(powerup)[0]
            const powerQuantity = userData.powerups[powerUpText]
            if (powerQuantity < 1) throw({message: 'User has not enough ' + powerUpText, code: 3})
            let incObject = {}
            incObject['powerups.' + powerUpText] = -1
            await this.query.updatePowerUps(userId, {$inc: incObject})
        })


    }

}

module.exports = gameDataServiceClass
