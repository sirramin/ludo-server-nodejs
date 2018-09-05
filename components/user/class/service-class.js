const jwt = require('../../common/jwt'),
    _ = require('lodash'),
    query = require('./query'),
    bcryptjs = require('bcryptjs')


const userServiceClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        this.query = new query(this.dbUrl)
    }

    async signin(username, password) {
        const userInfo = await this.query.checkUserExists(username)
        if (!userInfo) throw({message: 'User not exists', code: 3})
        if (!userInfo.hasOwnProperty('password'))
            throw({message: 'No password exists', code: 4})
        const hashedPass = userInfo.password
        if(!await bcryptjs.compare(password, hashedPass))
            throw({message: 'Password is not match', code: 5})
        const token = await jwt.generateJwt(this.dbUrl, userInfo._id, userInfo.name, userInfo.market, undefined, username)
        return token
    }

}

module.exports = userServiceClass
