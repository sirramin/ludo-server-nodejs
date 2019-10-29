const jwt = require('../../common/jwt')
const _ = require('lodash')
const redisHelperUser = require('../redisHelper/user')
const userModel = require('./model')

exports.registerGuestUser = async () => {
  const username = 'guest_' + _.random(111111, 999999)
  const guest = await userModel.create({username})
  const userId = guest._doc._id.toString()
  await redisHelperUser.addGuestToRedis(username, userId)
  const token = await jwt.generateJwt(userId, username)
  return {
    token: token,
    username: username
  }
}

