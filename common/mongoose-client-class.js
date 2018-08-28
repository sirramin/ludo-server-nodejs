const mongooseClient = require('mongoose')
const mongooseClientClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
    }

    getClient() {
        if (!connections[this.dbUrl])
            connections[this.dbUrl] = mongooseClient.createConnection('mongodb://localhost/' + this.dbUrl)

        connections[this.dbUrl].on('error', console.error.bind(console, 'connection error:'))
        connections[this.dbUrl].once('open', function () {
            logger.info('mongoose connected to:' + this.dbUrl)
        })

        return mongooseClient
    }

}

module.exports = mongooseClientClass
