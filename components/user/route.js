const router = require('express').Router()
const service = require('./service')

router.post('/signInAsGuest', async (req, res, next) => {
  const tokenAndUserId = await service.registerGuestUser()
  // await gameServiceObj.insertUserGameData(tokenAndUserId.userId)
  res.send({
    token: tokenAndUserId.token,
    game: req.dbUrl
  })
})


module.exports = router

