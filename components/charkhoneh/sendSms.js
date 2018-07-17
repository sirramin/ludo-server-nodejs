'use strict'

const rpn = require('request-promise-native')

module.exports = (dbUrl) => {
    const config = require('./config')[dbUrl]

    function sendVerificationCodeByVas(phoneNumber, content) {
        return new Promise((resolve, reject) => {

            const phoneNumber = '98' + phoneNumber.substr(1)
            let url = config[dbUrl].verificationCodeProvider
            url = String.format(url, phoneNumber, content)

            let options = {
                url: url,
                method: 'get',
                timeout: 45000,
                json: true
            }

            rpn(options, (err, res) => {
                if (err) {
                    logger.error(`VAS service error [${err.stack}]`)
                    return reject(err)
                } else {
                    logger.info('sending verification code [params=' + phoneNumber + content + ']')
                    if (!res || res.statusCode >= 400) {
                        return reject(new Error('invalid sendContent by vas service response'))
                    }
                    resolve(res)
                }
            })
        })
    }

    return {
        sendVerificationCodeByVas: sendVerificationCodeByVas
    }
}

