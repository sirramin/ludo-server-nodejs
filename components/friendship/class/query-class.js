const userModelClass = require('../../user/class/model-class')

const userQueryClass = class {

    constructor(dbUrl) {
        const userModelObject = new userModelClass(dbUrl)
        this.userModel = userModelObject.getModel()
    }

    async searchByUsername(username) {
        return await this.userModel.findOne({username: username}).lean().exec()
    }

    async searchById(userId) {
        return await this.userModel.findOne({_id: userId}).lean().exec()
    }

    async addToFollowings(userId, username, followingId) {
        return await this.userModel.findOneAndUpdate({_id: userId}, {
            $addToSet: {
                followings: {
                    username: username,
                    userId: followingId
                }
            }
        }).lean().exec()
    }

    async addToOpponentFollowers(myUsername, myUserId, username) {
        return await this.userModel.findOneAndUpdate({username: username}, {
            $addToSet: {
                followers: {
                    username: myUsername,
                    userId: myUserId
                }
            }
        }).lean().exec()
    }

    async removeFromArray(userId, username) {
        return await this.userModel.findOneAndUpdate({_id: userId}, {$pull: {friends: username}}).lean().exec()
    }

}

module.exports = userQueryClass