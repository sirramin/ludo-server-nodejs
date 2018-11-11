const _ = require('lodash'),
    queryClass = require('./query-class')


const userServiceClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        this.queryClassObj = new queryClass(this.dbUrl)
    }

    async checkUpdateStatus(playerVersion, gameMeta) {
        const latestVersion = this.convertVersionToDecimal(gameMeta.latestVersion)
        const minimumSupportedVersion = this.convertVersionToDecimal(gameMeta.minimumSupportedVersion)
        const playerVersionDecimal = this.convertVersionToDecimal(playerVersion)

        if (playerVersionDecimal === latestVersion)
            return {message: 'player has latest version', code: 1}
        else if (playerVersionDecimal >= minimumSupportedVersion)
            return {
                message: 'player has not latest version but still can play',
                code: 2,
                data: {marketUrl: gameMeta.marketUrl}
            }
        else
            return {
                message: 'force update',
                code: 3,
                data: {marketUrl: gameMeta.marketUrl}
            }
    }

    convertVersionToDecimal(versionString) {
        const dotIndex = versionString.indexOf('.')
        const majorInt = parseInt(versionString.substr(0, dotIndex))
        const minorAndBuildInt = parseFloat(versionString.substr(dotIndex + 1, versionString.length))
        return majorInt + minorAndBuildInt
    }

}

module.exports = userServiceClass
