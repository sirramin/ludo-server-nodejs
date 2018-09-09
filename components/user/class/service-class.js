const jwt = require('../../../common/jwt'),
    _ = require('lodash'),
    queryClass = require('./query-class'),
    bcryptjs = require('bcryptjs'),
    nodemailer = require('nodemailer')


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
        const emailCode = _.random(1000, 9999)
        await this.queryClassObj.saveEmailCode(userInfo._id, emailCode)
        await userServiceClass.sendMail(userInfo.email, emailCode)
        return userInfo._id
    }

    async sendMail(email, emailCode) {
        let transporter = nodemailer.createTransport({
            host: 'mail.artagamestudio.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: 'ramin.s@artagamestudio.com',
                pass: 'q9Xd22W3y9'
                // user: 'forgot@artagamestudio.com',
                // pass: 'u3zHnBTp'
            },
            tls: {
                rejectUnauthorized: false
            }
        })

        let mailOptions = {
            from: '"Menchman Support"  <ramin.s@artagamestudio.com>',
            to: email,
            subject: 'فراموشی رمز',
            // text: emailCode + 'کد: ',
            html: '<span>کد فراموشی رمز شما: </span><span>' + emailCode + '</span>'
        }
        try {
            const info = await userServiceClass.sendMail(mailOptions)
            logger.info('Forgot email sent: %s', info.messageId)
        }
        catch (e) {
            logger.error('Error sending email: ' + e)
            throw({message: 'Error sending email', code: 6})
        }
    }

    async verifyCode(userId, emailCode) {
        const emailCodeInDb = await this.queryClassObj.getUserEmailCode(userId)
        if(!emailCodeInDb)
            throw({message: 'User has not request code before', code: 3})
        if(emailCodeInDb !== emailCode)
            throw({message: 'code is not correct', code: 3})
        return true
    }

}

module.exports = userServiceClass
