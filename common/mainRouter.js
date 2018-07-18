const router = require('express').Router();

// split up route handling
// router.use('/products', require('./products'));
// router.use('/categories', require('./categories'));
// etc.

router.use('/otp', require('../components/otp/route')())
router.use('/user', require('../components/user/route')())
router.use('/charkhoneh', require('../components/charkhoneh/route')())
router.use('/leaderboard', require('../components/leaderboard/route')())

module.exports = router;