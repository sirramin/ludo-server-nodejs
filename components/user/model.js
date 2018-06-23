const mongoose = require('../../common/mongoose-client');
const userSchema = mongoose.Schema({
    username: {type: String, unique: true},
    password: String,
    phoneNumber: {type: Number, unique: true},
});
const userModel = mongoose.model('users', userSchema);

module.exports = userModel