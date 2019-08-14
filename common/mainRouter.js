const router = require('express').Router()

module.exports = () => {
    router.use('/user', require('../components/user/route'))
    router.use('/leaderboard', require('../components/leaderboard/route'))
    router.use('/menchman', require('../components/logics/route'))
    router.use('/friendship', require('../components/friendship/route'))
    router.use('/general', require('../components/general/route'))
    return router
}