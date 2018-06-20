const mongooseClient = require('mongoose');
mongooseClient.connect('mongodb://localhost/master-of-minds');
const db = mongooseClient.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.info('mongoose connected')
});
module.exports = mongooseClient