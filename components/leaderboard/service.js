const
    Leaderboard = require('leaderboard-promise'),
    _ = require('lodash'),
    asyncRedis = require("async-redis"),
    // redis = require('redis'),
    redisClient = asyncRedis.createClient(),
    lb = new Leaderboard('otp', redisClient)


redisClient.on("error", function (err) {
    console.log("Error " + err);
});

const getLeaderboard = async (userId) => {
    try {
        const list = await lb.list()
        const userGameDetails = await redisClient.hget('users', userId)
        return {
            list: list,
            users: users
        }
    }
    catch (e) {
        return err
    }
}

const addScore = async (userId, league = 1, isWinner) => {
    await lb.add('ramin', 10)
    const userGameDetails = await redisClient.hget('users', userId)
    const UserInfo = {
        [userId]: {
            'win': 5,
            'lose': 2
        }
    }
    return await redisClient.hmset('users', 'ramin', JSON.stringify(UserInfo))
}

module.exports = {
    getLeaderboard: getLeaderboard,
    addScore: addScore
}
