const mongooseClient = require('mongoose')
let dbUrl4
const mongooseClientClass = class {

    constructor(dbUrl) {

        dbUrl4 = dbUrl
    }

    getClient() {
        if (!connections[dbUrl4] && dbUrl4 !== undefined) {
            const mongoUrl = process.env.docker ? 'mongodb://mongo/' : 'mongodb://localhost/'
            connections[dbUrl4] = mongooseClient.createConnection(mongoUrl + dbUrl4, { useNewUrlParser: true })

            connections[dbUrl4].on('error', console.error.bind(console, 'connection error:'))
            // const dbUrl2 = this.dbUrl
            connections[dbUrl4].once('open', function () {
                logger.info('mongoose connected to:' + dbUrl4)
            })
        }

        return mongooseClient
    }
}

module.exports = mongooseClientClass
