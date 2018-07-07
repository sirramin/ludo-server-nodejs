module.exports = (dbName) => {
    const mongooseClient = require('mongoose');
    // exports.getDatabaseConnection = function (dbName) {
    //     if (connections[dbName]) {
    //         //database connection already exist. Return connection object
    //         return connections['dbName'];
    //     } else {
    //         connections[dbName] = mongoose.createConnection('mongodb://localhost:27017/' + dbName);
    //         return connections['dbName'];
    //     }
    // }
    if(!connections[dbName])
    connections[dbName] = mongooseClient.createConnection('mongodb://localhost/' + dbName);

    // const db = mongooseClient.connection;
    connections[dbName].on('error', console.error.bind(console, 'connection error:'));
    connections[dbName].once('open', function () {
        console.info('mongoose connected')
    });
    return {
        connections: connections[dbName],
        mongooseClient: mongooseClient
    }
}