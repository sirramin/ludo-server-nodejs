const router = require('express').Router()
const service = require('./service')

router.post('/signInAsGuest', async (req, res, next) => {
  const tokenAndUserId = await service.registerGuestUser()
  res.send({
    token: tokenAndUserId.token,
    userId: tokenAndUserId.userId
  })
  // await gameServiceObj.insertUserGameData(tokenAndUserId.userId)

})


module.exports = router

