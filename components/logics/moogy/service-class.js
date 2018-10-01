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

}

module.exports = gameDataServiceClass
