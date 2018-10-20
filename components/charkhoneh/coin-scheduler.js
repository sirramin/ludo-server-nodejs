module.exports = (dbUrl) => {
    const schedule = require('node-schedule')
    logger.info('Schedule module start')
    const userModel = require('../user/model')(dbUrl)
    let dailyCurrency
    if(dbUrl === 'moogy')
        dailyCurrency = 10
    else
        dailyCurrency = 200

    schedulerExecuted = true
    schedule.scheduleJob('0 59 23 * * *', function () {
        logger.log('Coin schedule exceuted at ' + Date())
        userModel.updateMany({
                market: 'mtn',
                charkhonehCancelled: false,
                charkhonehHistory: {$ne: []},
            }, {
                $inc: {coin: dailyCurrency}
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
