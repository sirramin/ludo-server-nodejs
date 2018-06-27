const mongoose = require('../../common/mongoose-client');
const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    username: {type: String, unique: true, index: false },
    password: String,
    phoneNumber: {type: String, unique: true, index: false},
    market: {type: String, required: true},
    coin: {type: Number, default: 0},
    registerDate: {type: Date, default: new Date()},
    verificationCode: Number
});
userSchema.set('autoIndex', false);
const userModel = mongoose.model('users', userSchema);

module.exports = userModel