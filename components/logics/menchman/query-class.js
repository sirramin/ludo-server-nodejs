const userGameDataModelClass = require('./model-class')
const mongoose = require('mongoose')
const ObjectId = mongoose.Types.ObjectId
const userGameDataQueryClass = class {

    constructor(dbUrl) {
        this.dbUrl = dbUrl
        this.userGameDataModelObj = new userGameDataModelClass(dbUrl)
        this.userGameDataModel = this.userGameDataModelObj.getModel()
        this.castleModel = this.userGameDataModelObj.getCastleModel()
    }

    async getUserData(userId) {
        // const userData = await this.userGameDataModel.findOne({userId: ObjectId(userId)}).populate('userId').lean().exec()
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
        return userData
    }

    async getCastleCoin(castleNumber) {
        const castleData = await this.castleModel.findOne({number: castleNumber})
        return castleData.coin
    }

    async addCastleToUserGameData(userId, castleNumber) {
        const userGameData = await this.userGameDataModel.findOneAndUpdate({userId: userId}, {$set: {selectedCastle: castleNumber }, $addToSet: { unlockedCastles: castleNumber } }, {new: true})
        return userGameData.unlockedCastles
    }
}

module.exports = userGameDataQueryClass


