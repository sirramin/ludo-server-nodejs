const response = require('../../common/response')
const router = require('express').Router()
const service = require('./service')

router.post('/signInAsGuest', async (req, res, next) => {
  const tokenAndUserId = await service.registerGuestUser(),
    gameService = require('../logics/' + req.dbUrl + '/service-class'),
    gameServiceObj = new gameService(req.dbUrl)
  await gameServiceObj.insertUserGameData(tokenAndUserId.userId)
  response(res, '', 2, {
    token: tokenAndUserId.token,
    game: req.dbUrl
  })
})


module.exports = router

