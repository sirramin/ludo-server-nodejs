module.exports = (dbUrl) => {
    const mongooseClient = require('mongoose');
    if(!connections[dbUrl])
    connections[dbUrl] = mongooseClient.createConnection('mongodb://localhost/' + dbUrl);
    connections[dbUrl].on('error', console.error.bind(console, 'connection error:'));
    connections[dbUrl].once('open', function () {
        console.info('mongoose connected')
    })
    return {
        connections: connections,
        mongooseClient: mongooseClient
    }
}