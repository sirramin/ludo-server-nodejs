const router = require('express').Router()
const service = require('./service')
const Boom = require('@hapi/boom')
const {signInAsGuestBuf, testFlatBufferBuf} = require('./flat/data/user')

router.post('/signInAsGuest', async (req, res, next) => {
  // throw Boom.badRequest('test')
  const {token, username} = await service.registerGuestUser()
  // await gameServiceObj.insertUserGameData(tokenAndUserId.userId)
  // res.send({
  //   token: token,
  //   userId: userId
  // })
  const buf = signInAsGuestBuf(token, username)
  res.set('Content-type', 'application/x-flatbuffers');
  res.send(buf)
  // res.send(buf)
})

router.get('/testFlatBuffer', async (req, res, next) => {
  const buf = testFlatBufferBuf()
  res.send(Buffer.from(buf))
})

module.exports = router

