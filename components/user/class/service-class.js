const jwt = require('../../../common/jwt'),
    _ = require('lodash'),
    queryClass = require('./query-class'),
    bcryptjs = require('bcryptjs')


const userServiceClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        this.queryClassObj = new queryClass(this.dbUrl)
    }

    async signin(username, password) {
        const userInfo = await this.queryClassObj.checkUserExists(username)
        if (!userInfo) throw({message: 'User not exists', code: 3})
        if (!userInfo.hasOwnProperty('password'))
            throw({message: 'No password exists', code: 4})
        const hashedPass = userInfo.password
        if (!await bcryptjs.compare(password, hashedPass))
            throw({message: 'Password is not match', code: 5})
        const token = await jwt.generateJwt(this.dbUrl, userInfo._id, userInfo.name, userInfo.market, undefined, username)
        return token
    }

    async updateUser(userId, username, pass, email, name) {
        let updateObject = {}, hashedPassword
        if (username) updateObject.username = username
        if (email) updateObject.email = email
        if (name) updateObject.name = name
        if (pass) {
            hashedPassword = await bcryptjs.hash(pass, 10)
            updateObject.password = hashedPassword
        }
        return await this.queryClassObj.updateUser({_id: userId}, updateObject)
    }

    async forgot(emailOrUsername) {
        const userInfo = await this.queryClassObj.checkUserExistsByEmailOrUsername(emailOrUsername)
        if (!userInfo) throw({message: 'User not exists', code: 3})
        if (!userInfo.hasOwnProperty('email'))
            throw({message: 'User has not set any email', code: 4})
        const emailCode = _.random(100000, 999999)
        await this.queryClassObj.saveEmailCode(userInfo._id, emailCode)
    }

    async sendMail(email) {
        // let transporter = nodemailer.createTransport(transport[, defaults])

    }

}

module.exports = userServiceClass
