const mongooseClient = require('mongoose');
let connections = {};

exports.getDatabaseConnection = function(dbName) {
    if(connections[dbName]) {
        //database connection already exist. Return connection object
        return connections['dbName'];
    } else {
        connections[dbName] = mongoose.createConnection('mongodb://localhost:27017/' + dbName);
        return connections['dbName'];
    }
}
// mongooseClient.connect('mongodb://localhost/');
const db = mongooseClient.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.info('mongoose connected')
});
module.exports = mongooseClient