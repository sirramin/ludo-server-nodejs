const jsonwebtoken = require('jsonwebtoken');
const secret = 'F3D7F9733FD81DB87B57AC54D4D17'

const generateJwt = async (dbUrl, userId, name, market, phoneNumber, username) => {
    const payload = {
        dbUrl: dbUrl,
        userId: userId,
        name: name,
        market: market
    }
    if(phoneNumber){
        payload.phoneNumber = phoneNumber
    }
    if(username){
        payload.username = username
    }

    return await jsonwebtoken.sign(payload, secret, {expiresIn: '100 days'});
}
const verifyJwt = async (token) => {
    return await jsonwebtoken.verify(token, secret)
}

module.exports = {
    generateJwt: generateJwt,
    verifyJwt: verifyJwt
}