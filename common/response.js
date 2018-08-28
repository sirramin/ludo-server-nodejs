const response = (res, message, code = 200, data = {}) => {
    let dataLog
    if (typeof(data) === 'object')
        dataLog = (JSON.stringify(data).length < 400) ? JSON.stringify(data) : '[Big object]'
    else
        dataLog = data

    logger.info(message + ' ' + code + ' ' + dataLog)

    res.send({
        code: code,
        message: message,
        data: data
    })
}
module.exports = response