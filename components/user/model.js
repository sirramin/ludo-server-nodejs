const _ = require('lodash')
module.exports = (dbUrl) => {
    const {mongooseClient, connections} = require('../../common/mongoose-client')(dbUrl);
    const userSchema = new mongooseClient.Schema({
        name: {type: String, required: true},
        username: {type: String, unique: true, index: false},
        password: String,
        phoneNumber: {type: String, unique: true, index: false},
        market: {type: String, required: true},
        coin: {type: Number, default: 0},
        registerDate: {type: Date, default: new Date()},
        verificationCode: Number
    });
    userSchema.set('autoIndex', false);
    if (_.has(connections[dbUrl].models, 'users'))
        return connections[dbUrl].model('users');
    else
        return connections[dbUrl].model('users', userSchema);
}