const router = require('express').Router()

module.exports = (io) => {
    router.use('/user', require('../components/user/route')())
    router.use('/leaderboard', require('../components/leaderboard/route')())
    router.use('/menchman', require('../components/logics/menchman/route')(io))
    router.use('/friendship', require('../components/friendship/route')(io))
    router.use('/general', require('../components/general/route')(io))
    return router
}