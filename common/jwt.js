const jsonwebtoken = require('jsonwebtoken');
const secret = 'F3D7F9733FD81DB87B57AC54D4D17'

const generateJwt = async (gameId, userId, name, market, phoneNumber = '', username, password) => {
    const payload = {
        gameId: gameId,
        userId: userId,
        name: name,
        market: market,
    }
    if(phoneNumber !== ''){
        payload.phoneNumber = phoneNumber
    }
    if(username && password){
        payload.username = username
        payload.password = password
    }

    return await jsonwebtoken.sign(payload, secret, {expiresIn: '10 days'});
}
const verifyJwt = async (token) => {
    return await jsonwebtoken.verify(token, secret)
}

module.exports = {
    generateJwt: generateJwt,
    verifyJwt: verifyJwt
}