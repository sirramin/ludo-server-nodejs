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

    async insertUserGameData(userId) {
        return await this.userGameDataModel.create({
            userId: userId
        })
    }
}

module.exports = userGameDataQueryClass

