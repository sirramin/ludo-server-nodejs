const _ = require('lodash')
const mongooseClient = require('../../common/mongoose-client')

const userSchema = new mongooseClient.Schema({
  username: {type: String},
  password: String,
  phoneNumber: {type: String},
  coin: {type: Number, default: 1400},
  win: {type: Number, default: 0},
  lose: {type: Number, default: 0},
  score: {type: Number, default: 0},
  registerDate: {type: Date, default: new Date()},
  verificationCode: String,
  email: String,
  emailCode: Number,
  followings: [],
  followers: [],
});
module.exports = mongooseClient.model('users', userSchema);
