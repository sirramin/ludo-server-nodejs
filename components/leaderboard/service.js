module.exports = (dbUrl, market) => {
    const query = require('./query')(dbUrl, market),
        Leaderboard = require('leaderboard-promise'),
        _ = require('lodash'),
        leaderboardPath = dbUrl + ':leaders:' + market,
        usersPath = dbUrl + ':users:' + market,
        redisClient = require('../../common/redis-client'),
        lb = new Leaderboard(leaderboardPath)

    const getLeaderboard = async (name, userId) => {
        const userInfo = await redisClient.hget(usersPath, userId)
        const userRank = await lb.rank(userId) + 1
        const userScore = await lb.score(userId)

        try {
            const top20 = await lb.membersInRankRange(0, 19)
            const top20WithInfo = []
            const asyncLoop = async (top20) => {
                for (let i = 0; i < top20.length; i++) {
                    const otherUser = top20[i]
                    const otherUserInfo = await redisClient.hget(usersPath, otherUser.member)
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
                let prevUser = await lb.at(userRank - 1);
                prevUser.rank = userRank - 1;
                prevUser.member = JSON.parse(prevUser.member)

                let nextUser = await lb.at(userRank + 1);
                nextUser.rank = userRank + 1;
                nextUser.member = JSON.parse(nextUser.member)

                const userTotalInfo = {}
                userTotalInfo.member = JSON.parse(userInfo)
                userTotalInfo.rank = userRank;
                userTotalInfo.score = userScore;

                [prevUser, userTotalInfo, nextUser].forEach(user => {
                    if (user)
                        middleRank.push(user)
                })

                leaders.middleRanks = middleRank
            }

            return leaders
        }
        catch (e) {
            console.log(e)
            throw e
        }
    }

    const addScore = async (name, userId, league = 1, isWinner) => {
        let userGameDetails = await redisClient.hget(usersPath, userId)
        if (!userGameDetails) {
            await firstTimeScore(name, userId)
            userGameDetails = await redisClient.hget(usersPath, userId)
        }
        const score = await query.findLeagueScore(league)
        const userWins = JSON.parse(userGameDetails).win
        const userloses = JSON.parse(userGameDetails).lose
        const userInfo = {
            "name": name,
            "userId": userId,
            "win": isWinner ? userWins + 1 : userWins,
            "lose": !isWinner ? userloses + 1 : userloses
        }
        await lb.incr(userId, score)
        return await redisClient.hmset(usersPath, userId, JSON.stringify(userInfo))
    }

    const firstTimeScore = async (name, userId) => {
        const userInfo = {
            "name": name,
            "userId": userId,
            "win": 0,
            "lose": 0
        }
        await lb.add(userId, 0)
        return await redisClient.hmset(usersPath, userId, JSON.stringify(userInfo))
    }


    return {
        getLeaderboard: getLeaderboard,
        addScore: addScore,
        firstTimeScore: firstTimeScore
    }
}
