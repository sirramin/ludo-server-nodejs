rpn = require('request-promise-native')
const checkUserExists = async (phoneNumber) => {
    const options = {
        method: 'POST',
        uri: 'https://landing.artatel.ir/api/otp/v1/confirmation/masterOfMind/' + phoneNumber,
        body: {
            "verificationCode":
        },
        json: true // Automatically stringifies the body to JSON
    };
    await rpn.post(options)
}
module.exports = {
    checkUserExists: checkUserExists
}