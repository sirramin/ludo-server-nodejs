const query = require('./query')
Leaderboard = require('leaderboard-promise'),
    _ = require('lodash'),
    asyncRedis = require("async-redis"),
    // redis = require('redis'),
    redisClient = asyncRedis.createClient(),
    lb = new Leaderboard('master-of-minds:otp', redisClient)


redisClient.on("error", function (err) {
    console.log("Error " + err);
});

const getLeaderboard = async (username) => {
    const userInfo = await redisClient.hget('users', username)

    try {
        const top20 = await lb.membersInRankRange(0, 19)
        top20.forEach(user => {
            user.member = JSON.parse(user.member)
        })

        let leaders = {
            top20: top20
        }
        const userRank = await lb.rank(userInfo)
        const userScore = await lb.score(userInfo)
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
        return err
    }
}

const addScore = async (username, league = 1, isWinner) => {
    const userGameDetails = await redisClient.hget('users', username)
    const score = await query.findLeagueScore(league)
    let userInfo = {}
    if (userGameDetails) { //early user
        const userWins = JSON.parse(userGameDetails).win
        const userloses = JSON.parse(userGameDetails).lose
        userInfo = {
            "username": username,
            "win": isWinner ? userWins + 1 : userWins,
            "lose": !isWinner ? userloses + 1 : userloses
        }
        await lb.incr(JSON.stringify(userInfo), score)
    }
    else { // first time
        userInfo = {
            "username": username,
            "win": isWinner ? 1 : 0,
            "lose": !isWinner ? 1 : 0
        }
        // await lb.add(JSON.stringify(userInfo), score)
        await lb.add(JSON.stringify(userInfo), _.random(1, 99999))
    }

    return await redisClient.hmset('users', username, JSON.stringify(userInfo))
}


module.exports = {
    getLeaderboard: getLeaderboard,
    addScore: addScore
}
