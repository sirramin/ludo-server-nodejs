const router = require('express').Router()
const service = require('./service')
const Boom = require('@hapi/boom')

router.post('/signInAsGuest', async (req, res, next) => {
  next(Boom.badRequest('test'))
  const tokenAndUserId = await service.registerGuestUser()
  // await gameServiceObj.insertUserGameData(tokenAndUserId.userId)
  // res.send({
  //   token: tokenAndUserId.token,
  //   userId: tokenAndUserId.userId
  // })

})

module.exports = router

