module.exports = (dbUrl) => {
    const mongooseClient = require('mongoose')
    if (!connections[dbUrl]) {
        const mongoUrl = process.env.docker ? 'mongodb://mongo:27018/' : 'mongodb://localhost/'
        connections[dbUrl] = mongooseClient.createConnection(mongoUrl + dbUrl, {useNewUrlParser: true})
    }
    connections[dbUrl].on('error', console.error.bind(console, 'connection error:'))
    connections[dbUrl].once('open', function () {
        logger.info('mongoose connected to:' + dbUrl)
    })
    return {
        mongooseClient: mongooseClient
    }
}