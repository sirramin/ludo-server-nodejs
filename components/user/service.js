const jwt = require('../../common/jwt')
const _ = require('lodash')
const redisHelper = require('../redisHelper/user')

exports.registerGuestUser = async () => {
  const username = 'guest' + _.random(11111111, 99999999)
  try {
    const guest = await userModel.create({username})
    const userId = guest._doc._id.toString()
    await redisHelper.addGuestToRedis(username, userId)
    const token = await jwt.generateJwt(dbUrl, userId, name, market)
    return {token: token, userId: userId}
  } catch (err) {
    return ({message: 'error registering guest user', statusCode: 2})
  }
}

