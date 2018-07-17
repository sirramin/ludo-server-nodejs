module.exports = (dbUrl) => {
    const schedule = require('node-schedule')
    logger.info('Schedule module start')
    const argv = process.argv.slice(2)
    logger.info('argv: ' + argv)
    if (argv[0] === 'platform-Master') {
        const userModel = require('../models/users')(dbUrl)
        schedule.scheduleJob('0 59 23 * * *', function () {
            logger.log('Coin schedule exceuted at ' + Date());
            userModel.update({
                    market: 'mtn',
                    charkhonehCancelled: false,
                    charkhonehHistory: {$ne: []},
                }, {
                    $inc: {coin: 200}
                },
                {
                    multi: true
                })
                .then(WriteResult => {
                    logger.info('updating schedule coins info: ' + WriteResult)
                })
                .catch(err => {
                    logger.error('error updating schedule coins: ' + err)
                })
        })
    }
}
