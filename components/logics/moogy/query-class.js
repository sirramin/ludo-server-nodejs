const userGameDataModelClass = require('./model-class')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const userGameDataQueryClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        this.userGameDataModelObj = new userGameDataModelClass(dbUrl)
        this.userGameDataModel = this.userGameDataModelObj.getModel()
    }

    async getUserData(userId) {
        const userData = await this.userGameDataModel.aggregate([
            {
                $match: {
                    userId: ObjectId(userId)
                }
            },
            {
                $lookup:
                    {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'userInfo'
                    }
            }
        ]).exec()
        return userData[0]
    }

    async queryHintsCount(userId) {
        return await this.userGameDataModel.findOne({
            userId: userId
        })
    }

    async insertUserGameData(userId) {
        return await this.userGameDataModel.create({
            userId: userId
        })
    }

    async updateHints(userId, query) {
        return await this.userGameDataModel.findOneAndUpdate({userId: userId}, query, {new: true}).lean().exec()
    }
}

module.exports = userGameDataQueryClass


