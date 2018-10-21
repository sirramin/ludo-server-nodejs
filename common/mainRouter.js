const router = require('express').Router();

module.exports = (io) => {
    router.use('/otp', require('../components/otp/route')())
    router.use('/user', require('../components/user/route')())
    router.use('/charkhoneh', require('../components/charkhoneh/route')())
    router.use('/leaderboard', require('../components/leaderboard/route')())
    router.use('/menchman', require('../components/logics/menchman/route')(io))
    router.use('/master', require('../components/logics/master-of-minds/route')(io))
    router.use('/moogy', require('../components/logics/moogy/route')(io))
    return router
};