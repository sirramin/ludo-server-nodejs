module.exports = (dbName) => {
    const {mongooseClient, connections} = require('../../common/mongoose-client')(dbName);
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
    return connections.model('users', userSchema);
}