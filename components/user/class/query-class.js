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
        await this.userModel.update({_id: userId},
            {
                $set: {
                    win: win,
                    lose: lose,
                    score: score
                }
            })
    }

    async getUserCoins(userId) {
        return await this.userModel.findOne({userId: userId}).lean().exec()
    }

    async updateCoin(userId, coin) {
        return await this.userModel.findOneAndUpdate({_id: userId}, {$inc: {coin: coin}})
    }


}

module.exports = userQueryClass