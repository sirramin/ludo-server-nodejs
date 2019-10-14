const router = require('express').Router()
const service = require('./service')
const Boom = require('@hapi/boom')

const flatbuffers = require('../../flatBuffers/flatbuffers').flatbuffers
const builder = new flatbuffers.Builder(0)
const ReposList = require('../../flatBuffers/schemas/test_generated').ReposList

router.post('/signInAsGuest', async (req, res, next) => {
  // throw Boom.badRequest('test')
  const tokenAndUserId = await service.registerGuestUser()
  // await gameServiceObj.insertUserGameData(tokenAndUserId.userId)
  res.send({
    token: tokenAndUserId.token,
    userId: tokenAndUserId.userId
  })

})

router.post('/testFlatBuffer', async (req, res, next) => {
  const name = builder.createString('Ramin')
  ReposList.startReposList(builder)
  ReposList.addName(builder, name)
  const repo = ReposList.endReposList(builder)
  builder.finish(repo)
  const buf = builder.asUint8Array()
  res.send(buf)
})

module.exports = router

