const router = require('express').Router()
const service = require('./service')
const Boom = require('@hapi/boom')

const {flatbuffers} = require('../../flatBuffers/flatbuffers')
const builder = new flatbuffers.Builder(0)
const {ReposList} = require('../../flatBuffers/schemas/test_generated')
const {signInAsGuest} = require('./schemas/singInAsGuest_generated')

router.post('/signInAsGuest', async (req, res, next) => {
  // throw Boom.badRequest('test')
  const {token, userId} = await service.registerGuestUser()
  // await gameServiceObj.insertUserGameData(tokenAndUserId.userId)
  // res.send({
  //   token: token,
  //   userId: userId
  // })
  const tokenString = builder.createString(token)
  const userIdString = builder.createString(userId)
  signInAsGuest.startsignInAsGuest(builder)
  signInAsGuest.addToken(builder, tokenString)
  signInAsGuest.addUserId(builder, userIdString)
  const repo = signInAsGuest.endsignInAsGuest(builder)
  builder.finish(repo)
  const buf = builder.asUint8Array()
  res.send(buf)
})

router.get('/testFlatBuffer', async (req, res, next) => {
  const name = builder.createString('Ramin')
  ReposList.startReposList(builder)
  ReposList.addName(builder, name)
  const repo = ReposList.endReposList(builder)
  builder.finish(repo)
  const buf = builder.asUint8Array()
  res.send(buf)
})

module.exports = router

