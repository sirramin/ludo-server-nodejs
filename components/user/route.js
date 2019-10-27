const router = require('express').Router()
const service = require('./service')
const Boom = require('@hapi/boom')

router.post('/signInAsGuest', async (req, res, next) => {
  // throw Boom.badRequest('test')
  const {token, username} = await service.registerGuestUser()
  // await gameServiceObj.insertUserGameData(tokenAndUserId.userId)
  res.send({
    token,
    username
  })

})

module.exports = router

