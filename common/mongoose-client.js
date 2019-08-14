const mongooseClient = require('mongoose')
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost'
const connections = mongooseClient.createConnection(mongoUrl + '/mench', {useNewUrlParser: true})
connections.on('error', console.error.bind(console, 'connection error: '))
connections.once('open', function () {
  logger.info('mongoose connected')
})
module.exports = mongooseClient

