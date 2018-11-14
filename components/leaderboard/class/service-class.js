const Leaderboard = require('leaderboard-promise'),
    redisClient = require('../../../common/redis-client'),
    _ = require('lodash'),
    queryClass = require('./query-class'),
    userQueryClass = require('../../user/class/query-class')

const leaderboardClass = class {

    constructor(dbUrl, market) {
        this.dbUrl = dbUrl
        this.market = market
        this.query = new queryClass(dbUrl)
        this.userQuery = new userQueryClass(dbUrl)
        this.marketName = (this.market === 'mtn' || this.market === 'mci') ? this.market : 'market'
        this.leaderboardPath = this.dbUrl + ':leaders:' + this.marketName
        this.usersPath = this.dbUrl + ':users:' + this.marketName
        // this.redisOptions = process.env.docker ? {host: 'redis', port: 6378} : {host: 'localhost', port: 6379}
        this.lb = new Leaderboard(this.leaderboardPath, null, process.env.REDIS_URL)
    }


    async getLeaderboard(name, userId) {
        const userInfo = await redisClient.hget(this.usersPath, userId)
        const userRank = await this.lb.rank(userId) + 1
        const userScore = await this.lb.score(userId)
        try {
            const top20 = await this.lb.membersInRankRange(0, 19)
            let top20WithInfo = []
            const asyncLoop = async (top20) => {
                for (let i = 0; i < top20.length; i++) {
                    const otherUser = top20[i]
                    const otherUserInfo = await redisClient.hget(this.usersPath, otherUser.member)
                    top20WithInfo.push({
                        rank: otherUser.rank + 1,
                        memberInfo: JSON.parse(otherUserInfo),
                        score: otherUser.score
                    })
                }
            }
            await asyncLoop(top20)

            let leaders = {
                top20: top20WithInfo
            }

            let middleRank = []
            if (userRank > 20) {
                const userRankInSortedSet = userRank - 1
                let prevUser = await this.lb.at(userRankInSortedSet - 1)
                const prevUserInfo = await redisClient.hget(this.usersPath, prevUser.member)
                prevUser.rank = userRank - 1
                prevUser.memberInfo = JSON.parse(prevUserInfo)
                delete prevUser.member

                let nextUser = await this.lb.at(userRankInSortedSet + 1)
                if (nextUser) {
                    const nextUserInfo = await redisClient.hget(this.usersPath, nextUser.member)
                    nextUser.rank = userRank + 1
                    nextUser.memberInfo = JSON.parse(nextUserInfo)
                    delete nextUser.member
                }

                let userTotalInfo = {}
                userTotalInfo.memberInfo = JSON.parse(userInfo)
                userTotalInfo.rank = userRank
                userTotalInfo.score = userScore

                middleRank = [prevUser, userTotalInfo]
                if (nextUser) middleRank.push(nextUser)

                leaders.middleRanks = middleRank
            }

            return leaders
        }
        catch (e) {
            logger.error(e)
            throw e
        }
    }


    async addScore(name, userId, league = 1, isWinner) {
        let userGameDetails = await redisClient.hget(this.usersPath, userId)
        if (!userGameDetails) {
            await firstTimeScore(name, userId)
            userGameDetails = await redisClient.hget(this.usersPath, userId)
        }
        const leagueScore = await this.query.findLeagueScore(league)
        const userWins = JSON.parse(userGameDetails).win
        const userloses = JSON.parse(userGameDetails).lose
        const userInfo = {
            "name": name,
            "userId": userId,
            "win": isWinner ? userWins + 1 : userWins,
            "lose": !isWinner ? userloses + 1 : userloses
        }
        if (isWinner)
            await this.lb.incr(userId, leagueScore)
        const newScore = await this.lb.score(userId)
        await this.userQuery.updateScoreInMongo(userId, userInfo.win, userInfo.lose, newScore)
        return await redisClient.hmset(this.usersPath, userId, JSON.stringify(userInfo))
    }


    async firstTimeScore(name, userId) {
        const userInfo = {
            "name": name,
            "userId": userId,
            "win": 0,
            "lose": 0
        }
        await this.lb.add(userId, 0)
        await redisClient.hmset(this.usersPath, userId, JSON.stringify(userInfo))
    }


    async changeName(newName, userId) {
        const userInfo = await redisClient.hget(this.usersPath, userId)
        const userInfoParse = JSON.parse(userInfo)
        userInfoParse.name = newName
        logger.info('newName: ' + userInfoParse.name)
        await redisClient.hset(this.usersPath, userId, JSON.stringify(userInfoParse))
    }

    async getLeagues() {
        return await this.query.getLeagues()
    }

}

module.exports = leaderboardClass
