const jsonwebtoken = require('jsonwebtoken');
const secret = 'F3D7F9733FD81DB87B57AC54D4D17'

const generateJwt = async (userId, username) => {
    const payload = {
        userId,
        username,
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