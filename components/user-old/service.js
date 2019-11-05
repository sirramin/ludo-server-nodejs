const jwt = require('../../common/jwt')
const _ = require('lodash')
const redisClient = require('../../common/redis-client')
const usersPath = 'menchman' + ':users:' + 'market'

module.exports = (dbUrl, market) => {
  const query = require('./query')(dbUrl)

  const checkUserExists = async (username) => {
    return await query.checkUserExists(username)
  }

  // const registerUser = async (username, password, phoneNumber) => {
  //     const name = 'user' + _.random(1, 99999)
  //     try {
  //         const user = await query.insertUser(username, password, phoneNumber, market, name)
  //         const userId = guest._doc._id.toString()
  //         const token = await jwt.generateJwt(dbUrl, userId, name, market, undefined, username)
  //         return {token: token}
  //     }
  //     catch (err) {
  //         return ({message: 'error registering user', statusCode: 2})
  //     }
  // }

  const registerGuestUser = async () => {
    const name = 'guest' + _.random(1, 99999999)
    try {
      const guest = await query.insertGuestUser(market, name)
      const userId = guest._doc._id.toString()
      await addUserToRedis(name, userId)
      const token = await jwt.generateJwt(dbUrl, userId, name, market)
      return {token: token, userId: userId}
    } catch (err) {
      return ({message: 'error registering guest user', statusCode: 2})
    }
  }

  const addUserToRedis = async (name, userId) => {
    const userInfo = {
      "name": name,
      "username": name,
      "userId": userId,
      "win": 0,
      "lose": 0
    }
    // await redisClient.hmset(usersPath, userId, JSON.stringify(userInfo))
    // const leaderboardService = require('../leaderboard/service')(dbUrl, market)
    // leaderboardService.firstTimeScore(name, userId)
  }

  return {
    // registerUser: registerUser,
    registerGuestUser,
    checkUserExists
  }
}