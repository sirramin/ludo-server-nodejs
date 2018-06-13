const jwt = require('./jwt');
const response = require('./response')
const isAuthenticated = async (req, res, next) => {
    const token = req.headers['token']
    if (!token) response(res, 'header token is required!', 422);
    try {
        return await jwt.verifyJwt(token)
    }
    catch (err) {
        response(res, 'Unauthorized', 401);
    }
}
module.exports = isAuthenticated