const winston = require('winston')
module.exports = () => {
    const logger = winston.createLogger({
        // format: winston.format.json(),
        transports: [
            new winston.transports.File({filename: 'error.log', level: 'error'}),
            new winston.transports.File({filename: 'combined.log'})
        ]
    })
    logger.info('test')
    return logger
}