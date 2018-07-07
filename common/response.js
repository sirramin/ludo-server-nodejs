const response = (res, message, code = 200, data = {}) => {
    console.info(message + ' ' + code + ' ' + data !== {} ? data : '')
    res.send({
        code: code,
        message: message,
        data: data
    })
}
module.exports = response