const jwt = require('../../common/jwt')
const _ = require('lodash')
const redisHelperUser = require('../redisHelper/user')
const userModel = require('./model')

exports.registerGuestUser = async () => {
  const username = 'guest' + _.random(11111111, 99999999)
  const guest = await userModel.create({username})
  const userId = guest._doc._id.toString()
  await redisHelperUser.addGuestToRedis(username, userId)
  const token = await jwt.generateJwt(userId, username)
  return {
    token: token,
    userId: userId
  }
}

