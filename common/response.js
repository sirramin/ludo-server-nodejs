const response = (res, message, code = 200, data = {}) => {
    logger.info(message + ' ' + code + ' ' + data)
    res.send({
        code: code,
        message: message,
        data: data
    })
}
module.exports = response