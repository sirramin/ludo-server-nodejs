const mongoose = require('../../common/mongoose-client');
const userSchema = mongoose.Schema({
    username: String,
    password: String,
    phoneNumber: Number
});
const userModel = mongoose.model('users', userSchema);

module.exports = userModel