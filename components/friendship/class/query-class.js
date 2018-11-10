const userModelClass = require('./model-class')

const userQueryClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        const userModelObject = new userModelClass(dbUrl)
        this.userModel = userModelObject.getModel()
    }


    async checkUserExists(username) {
        return await this.userModel.findOne({username: username}).lean().exec()
    }



    async checkUserExistsByEmailOrUsername(emailOrUsername) {
        return await this.userModel.findOne({
                $or: [{
                    email: emailOrUsername
                }, {
                    username: emailOrUsername
                }]
            }
        ).lean().exec()
    }

    async checkUserAlreadyExists(query) {
        return await this.userModel.findOne(query).lean().exec()
    }

    async getUserById(userId) {
        return await this.userModel.findById(userId).lean().exec()
    }

    async insertUser(username, hashedPassword, phoneNumber, market, name) {
        const user = new this.userModel({
            username: username,
            password: hashedPassword,
            phoneNumber: phoneNumber,
            market: market,
            name: name
        })
        return await user.save({lean: true})
    }

    async insertGuestUser(market, name) {
        // const user = new this.userModel({
        //     market: market,
        //     name: name
        // })
        // return await user.save()
        return await this.userModel.create({
            market: market,
            name: name
        })
    }

    async updateUser(query, update) {
        return await this.userModel.findOneAndUpdate(query, update, {new: true}).lean().exec()
    }

    async updateScoreInMongo(userId, win, lose, score) {
        await this.userModel.updateOne({_id: userId},
            {
                $set: {
                    win: win,
                    lose: lose,
                    score: score
                }
            })
    }

    async getUserCoins(userId) {
        return (await this.userModel.findOne({_id: userId}).lean().exec()).coin
    }

    async updateCoin(userId, coin) {
        return await this.userModel.findOneAndUpdate({_id: userId}, {$inc: {coin: coin}})
    }

    async saveEmailCode(userId, emailCode) {
        return await this.userModel.findOneAndUpdate({_id: userId}, {emailCode: emailCode})
    }

    async getUserEmailCode(userId) {
        const userInfo = await this.userModel.findById(userId).lean().exec()
        return userInfo.emailCode
    }

}

module.exports = userQueryClass