const _ = require('lodash')
module.exports = (dbUrl) => {
    const {mongooseClient} = require('../../common/mongoose-client')(dbUrl)
    const userSchema = new mongooseClient.Schema({
        name: {type: String, required: true},
        username: {type: String},
        password: String,
        phoneNumber: {type: String},
        market: {type: String, required: true},
        coin: {type: Number, default: 1400},
        win: {type: Number, default: 0},
        lose: {type: Number, default: 0},
        score: {type: Number, default: 0},
        registerDate: {type: Date, default: new Date()},
        verificationCode: String,
        charkhonehCancelled: Boolean,
        charkhonehHistory: [],
        charkhonehProducts: [],
        email: String,
        emailCode: Number,
        followings: [],
        followers: [],
    });
    // userSchema.set('autoIndex', false);
    if (_.has(connections[dbUrl].models, 'users'))
        return connections[dbUrl].model('users');
    else
        return connections[dbUrl].model('users', userSchema);
}