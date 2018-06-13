const response = (res, message, statusCode = 200, data = {}) => {
    console.info(message + ' ' + statusCode + ' ' + data)
    res.send({
        statusCode: statusCode,
        message: message,
        result: data
    })
}
module.exports = response