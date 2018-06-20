const
    Leaderboard = require('leaderboard-promise'),
    _ = require('lodash'),
    asyncRedis = require("async-redis"),
    // redis = require('redis'),
    redisClient = asyncRedis.createClient(),
    lb = new Leaderboard('master-of-minds:otp', redisClient)


redisClient.on("error", function (err) {
    console.log("Error " + err);
});

const getLeaderboard = async (userId) => {
    try {
        const list = await lb.list()
        const userGameDetails = await redisClient.hget('users', userId)
        return {
            list: list,
            users: userGameDetails
        }
    }
    catch (e) {
        return err
    }
}

const addScore = async (userId, league = 1, isWinner) => {
    const userGameDetails = await redisClient.hget('users', userId)
    const score = await query.findLeagueScore(league)
    const UserInfo = {}
    if (userGameDetails) { //early user
        const userWins = JSON.parse(userGameDetails).win
        const userloses = JSON.parse(userGameDetails).lose
        UserInfo[userId] = {
            'win': isWinner ? userWins + 1 : userWins,
            'lose': !isWinner ? userloses + 1 : userloses
        }
        await lb.incr(userId, score)
    }
    else { // first time
        await lb.add(userId, score)
    }

    return await redisClient.hmset('users', 'ramin', JSON.stringify(UserInfo))
}



module.exports = {
    getLeaderboard: getLeaderboard,
    addScore: addScore
}
