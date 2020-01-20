const mongooseClient = require('mongoose')
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost/mench'
const connections = mongooseClient.connect(mongoUrl,
    {
        useNewUrlParser: true,
        autoReconnect: true,
        useUnifiedTopology: true
    })
// connections.on('error', console.error.bind(console, 'connection error: '))
// connections.once('open', function () {
//   logger.info('mongoose connected')
// })
module.exports = mongooseClient

