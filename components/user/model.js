const mongoose = require('../../common/mongoose-client');
const userSchema = mongoose.Schema({
    name: {type: String, required: true},
    username: {type: String, unique: true},
    password: String,
    phoneNumber: {type: Number, unique: true},
    market: {type: String, required: true},
    coin: {type: Number, default: 0},
    registerDate: {type: Date, default: Date.now}
});
const userModel = mongoose.model('users', userSchema);

module.exports = userModel