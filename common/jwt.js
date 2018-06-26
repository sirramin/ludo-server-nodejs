const jsonwebtoken = require ('jsonwebtoken');
const secret = 'F3D7F9733FD81DB87B57AC54D4D17'
const generateJwt = async (paylod) => {
    return await jsonwebtoken.sign(paylod, secret, {expiresIn: '10 days'});
}
const verifyJwt = async (token) => {
    return await jsonwebtoken.verify(token, secret)
}

module.exports = {
    generateJwt: generateJwt,
    verifyJwt: verifyJwt
}