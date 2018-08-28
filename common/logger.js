const winston = require('winston')
const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
        new (winston.transports.Console)({timestamp: true}),
        new winston.transports.File({filename: 'error.log', level: 'error'}),
        new winston.transports.File({filename: 'combined.log'})
    ]
})
logger.info('test')
module.exports =  logger