const mongoose = require('../../common/mongoose-client');
const userSchema = mongoose.Schema({
    name: {type: String, required: true},
    username: {type: String, unique: true, required: false},
    password: String,
    phoneNumber: {type: String, unique: true},
    market: {type: String, required: true},
    coin: {type: Number, default: 0},
    registerDate: {type: Date, default: new Date()},
    verificationCode: Number
});
const userModel = mongoose.model('users', userSchema);

module.exports = userModel