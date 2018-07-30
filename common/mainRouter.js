const router = require('express').Router();

module.exports = (io) => {
    router.use('/otp', require('../components/otp/route')())
    router.use('/user', require('../components/user/route')())
    router.use('/charkhoneh', require('../components/charkhoneh/route')())
    router.use('/leaderboard', require('../components/leaderboard/route')())
    router.use('/logics', require('../components/logics/menchman/route')(io))
    return router
};